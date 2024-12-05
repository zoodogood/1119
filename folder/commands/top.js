"use strict";
import { BaseCommand } from "#lib/BaseCommand.js";

import { Emoji } from "#constants/emojis.js";
import { PermissionsBits } from "#constants/enums/discord/permissions.js";
import { SECOND } from "#constants/globals/time.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager } from "#lib/DataManager/singleton.js";
import { Pager } from "#lib/DiscordPager.js";
import BossManager from "#lib/modules/BossManager.js";
import QuestManager from "#lib/modules/QuestManager.js";
import {
	DotNotatedInterface,
	NumberFormatLetterize,
	ending,
	joinWithAndSeparator,
	random,
} from "#lib/safe-utils.js";
import { Collection } from "@discordjs/collection";
import { CliParser } from "@zoodogood/utils/primitives";
import { ComponentType, escapeMarkdown } from "discord.js";

class Flag_open {
  static FLAG_DATA = {
    name: "--open",
    capture: ["--open", "-o"],
    expectValue: true,
    description:
      "Мгновенно открывает выбранную вкладку или показывает их перечень",
  };

  capture;
  context;

  constructor(context) {
    this.context = context;
  }

  display_value_is_ignored() {
    const leaderboards = RanksUtils.leaderboardTypes
      .map((leaderboard) => leaderboard.key)
      .join(", ");
    this.context.channel.msg({
      content: `Флаг --open был проигнорирован. Используйте его с одним из этих значений: ${leaderboards}`,
    });
  }

  parse_and_process() {
    const capture = this.context.cliParsed
      .at(0)
      .captures.get(this.constructor.FLAG_DATA.name);

    if (!capture) {
      return false;
    }

    this.capture = capture;
    this.process_use_capture();
  }

  process_use_capture() {
    if (this.process_value_is_exists()) {
      return;
    }

    this.display_value_is_ignored();
  }

  process_value_is_exists() {
    const value = RanksUtils.leaderboardTypes.find((leaderboard) =>
      leaderboard.key.startsWith(this.capture.toString()),
    );
    if (!value) {
      return false;
    }

    this.context.selected = value;
    return value;
  }
}

class Flag_property {
  static FLAG_DATA = {
    name: "--property",
    capture: ["--property"],
    description: "Позволяет указать свойство для сортировки",
    expectValue: true,
  };
  static RankBase = {
    key: "advanced_property",
    component: {
      value: "advanced_property",
      label: "_advanced_property",
      emoji: "👾",
    },
    filter: (context) => context.advanced_property_flag,
    value: (element, context) => {
      const key = context.advanced_property_flag;
      return new DotNotatedInterface(element.data).getItem(key);
    },
    display: (element, output, index, context) => {
      const key = context.advanced_property_flag;
      const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
      const value = `${key}: ${output}`;
      return { name, value };
    },
  };
  constructor(context) {
    this.context = context;
  }
  parse_and_process() {
    const capture = this.context.cliParsed
      .at(0)
      .captures.get(this.constructor.FLAG_DATA.name);

    if (!capture) {
      return false;
    }

    this.capture = capture;
    this.process_use_capture();
  }

  process_use_capture() {
    this.context.advanced_property_flag = this.capture.valueOfFlag();
  }
}

class CommandRunContext extends BaseCommandRunContext {
  boss;
  flag_displayHidden_value;
  PAGE_SIZE = 15;
  pager = new Pager();
  selected = RanksUtils.leaderboardTypes.at(0);
  snowyEvent;
  sortedPull = null;
  users;
  values = null;

  static async new(interaction, command) {
    const context = new this(interaction, command);
    const { boss, showEvent } = interaction.guild.data;
    Object.assign(context, { boss: boss || {}, showEvent: showEvent || {} });
    return context;
  }

  _createValues() {
    const pull = (this.sortedPull =
      this.sortedPull ?? RanksUtils.createPull(this.users));

    const resolver = this.selected.value;
    for (const entrie of pull) {
      entrie[1] = resolver(entrie[0], this) ?? 0;
    }

    return RanksUtils.sortMutableAndFilterPull(pull);
  }

  calculatePages(elementsCount) {
    return Math.ceil(elementsCount / this.PAGE_SIZE);
  }

  createUsers() {
    const { interaction, flag_displayHidden_value: flag_displayHidden } = this;
    const needDisplay = (user) => {
      return (
        flag_displayHidden ||
        user.id === interaction.user.id ||
        (!user.bot && !user.data.profile_confidentiality)
      );
    };
    const users = interaction.guild.members.cache
      .map((element) => element.user)
      .filter(needDisplay);

    this.users = users;
  }

  parseCli(params) {
    const parsed = new CliParser()
      .setText(params)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.flag_displayHidden_value = values.get("--show-hidden");
    this.setCliParsed(parsed, values);

    new Flag_open(this).parse_and_process();
    new Flag_property(this).parse_and_process();
  }

  setupPager() {
    const { user, channel } = this.interaction;

    this.pager.setChannel(channel);
    const defaultComponents = this.pager.options.components;
    const components = [
      [...defaultComponents],
      [
        {
          type: ComponentType.StringSelect,
          options: RanksUtils.leaderboardTypes
            .filter(
              (leaderboard) => !leaderboard.filter || leaderboard.filter(this),
            )
            .map((leaderboard) => leaderboard.component),
          customId: "selectFilter",
          placeholder: "Сменить",
        },
      ],
    ];
    this.pager.setComponents(components);
    this.pager.setUser(user);
    this.pager.emitter.on(Pager.Events.before_update, (event) =>
      this.command.onPagerBeforePageRender(event, this),
    );

    this.pager.emitter.on(Pager.Events.allowed_collect, ({ interaction }) =>
      this.command.onPagerComponent(interaction, this),
    );
  }

  updateValues() {
    this.values = this._createValues();
    this.pager.setPagesLength(this.calculatePages(this.values.length));
  }
}
class RanksUtils {
  static leaderboardTypes = new Collection(
    Object.entries({
      level: {
        key: "level",
        component: {
          value: "level",
          label: "Уровень",
          emoji: "763767958559391795",
        },
        value: (element) => {
          const perLevel = LEVELINCREASE_EXPERIENCE_PER_LEVEL / 2;
          return (
            (element.data.level - 1) * perLevel * element.data.level +
            element.data.exp
          );
        },
        display: (element, output, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `Уровень: **${
            element.data.level
          }** | Опыта: ${NumberFormatLetterize(output)}`;
          return { name, value };
        },
      },
      coins: {
        key: "coins",
        component: {
          value: "coins",
          label: "По богатству",
          emoji: "637533074879414272",
        },
        value: (element) => {
          return (
            element.data.coins +
            element.data.berrys * DataManager.data.bot.berrysPrice
          );
        },
        display: (element, output, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `— ${element.data.coins} (${NumberFormatLetterize(
            output,
          )}) <:coin:637533074879414272>`;
          return { name, value };
        },
      },
      praises: {
        key: "praises",
        component: {
          value: "praises",
          label: "Количество полученных похвал",
          emoji: "630463177314009115",
        },
        value: (element) => {
          return element.data.praiseMe?.length;
        },
        display: (element, output, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `— Был похвален ${ending(
            output,
            "раз",
            "",
            "",
            "а",
          )}  <:wellplayed:630463177314009115>`;
          return { name, value };
        },
      },
      thief: {
        key: "thief",
        component: {
          value: "thief",
          label: "По грабежам",
          emoji: "🧤",
        },
        value: (element) => {
          return element.data.thiefCombo + ~~element.data.thiefWins / 5;
        },
        display: (element, output, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `Состояние перчаток: \`${element.data.thiefGloves}|${
            element.data.thiefCombo || 0
          }\` > Отбито атак: ${element.data.thiefWins | 0}`.replace(/-/g, "!");
          return { name, value };
        },
      },
      quests: {
        key: "quests",
        component: {
          value: "quests",
          label: "Достижения",
          emoji: "📜",
        },
        value: (element) => {
          return element.data.dayQuests;
        },
        display: (element, output, index) => {
          const cup =
            index === 0
              ? "<a:cupZ:806813908241350696> "
              : index === 1
                ? "<a:cupY:806813850745176114> "
                : index === 2
                  ? "<a:cupX:806813757832953876> "
                  : "";
          const name = `${cup} ${index + 1}. ${escapeMarkdown(element.username)}`;
          const globalQuests = (element.data.questsGlobalCompleted ?? "")
            .split(" ")
            .filter(Boolean);
          const value = `Выполнено ежедневных квестов: ${output} | Глобальных: ${
            globalQuests.length
          }/${QuestManager.questsBase.filter((base) => base.isGlobal).size}`;
          return { name, value };
        },
      },
      curses: {
        key: "curses",
        component: {
          value: "curses",
          label: "Пережито проклятий",
          emoji: Emoji.curse.toString(),
        },
        value: (element) => {
          return element.data.cursesEnded ?? 0;
        },
        display: (element, ended, index) => {
          const currentCount = element.curses?.length;
          const name = `${index + 1}. ${
            currentCount ? Emoji.curse.toString() : ""
          } ${escapeMarkdown(element.username)}`;
          const value = `Пережито проклятий: ${ended} ${
            currentCount ? ` | Текущие: ${currentCount}` : ""
          }`;
          return { name, value };
        },
      },
      witch: {
        key: "witch",
        component: {
          value: "witch",
          label: "Использования котла",
          emoji: "⚜️",
        },
        value: (element) => {
          return element.data.voidRituals;
        },
        display: (element, output, index, context) => {
          const username =
            element.id === context.interaction.user.id
              ? "?".repeat(element.username.length)
              : escapeMarkdown(element.username);
          const addingName =
            (index === 0 ? " <a:neonThumbnail:806176512159252512>" : "") +
            (random(9) ? "" : " <a:void:768047066890895360>");
          const name = `${index + 1}. ${username}${addingName}`;
          const value = `Использований котла ${
            random(3) ? element.data.voidRituals : "???"
          }`;
          return { name, value };
        },
      },
      boss: {
        key: "boss",
        component: {
          value: "boss",
          label: "Смотреть на урон по боссу",
          emoji: "⚔️",
        },
        filter: (context) => context.boss.isArrived,
        value: (element, context) => {
          return BossManager.getUserStats(context.boss, element.id).damageDealt;
        },
        display: (element, output, index, context) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `Великий воин нанёс ${NumberFormatLetterize(
            output,
          )} (${((output * 100) / context.boss.damageTaken).toFixed(
            1,
          )}%) урона`;
          return { name, value };
        },
      },
      chest: {
        key: "chest",
        component: {
          value: "chest",
          label: "Количество бонусов сундука",
          emoji: "805405279326961684",
        },
        value: (element) => {
          return element.data.chestBonus;
        },
        display: (element, output, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const value = `0b${output.toString(2)} (${output})`;
          return { name, value };
        },
      },
      snowyEvent: {
        key: "snowyEvent",
        component: {
          value: "snowyEvent",
          label: "Количество бонусов сундука",
          emoji: Emoji.snowyEvent.toString(),
        },
        filter: (snowyEvent) => snowyEvent?.isArrived,
        value: (element) => {
          const curse = element.data.curses?.find(
            (curse) => curse.id === "happySnowy",
          );
          if (curse) {
            return 0;
          }

          const snowflakes = curse.values.progress;
          return snowflakes;
        },
        display: (element, snowflakes, index) => {
          const name = `${index + 1}. ${escapeMarkdown(element.username)}`;
          const presents = element.data.presents;
          const presentsContent = presents
            ? `${ending(
                presents,
                "подар",
                "ков",
                "ок",
                "ка",
              )} ${Emoji.presents.toString()}`
            : null;
          const snowflakesContent = `${ending(
            presents,
            "снежин",
            "ок",
            "ка",
            "ки",
          )} ${Emoji.snowyEvent.toString()}`;
          const value = `${joinWithAndSeparator([
            snowflakesContent,
            presentsContent,
          ])}`;
          return { name, value };
        },
      },
      advanced_property: Flag_property.RankBase,
    }),
  );

  static createPull(users) {
    return users.map((user) => [user, null]);
  }

  static createPullWithResolver(users, resolver) {
    return users.map((user) => [user, resolver(user)]);
  }

  static sortMutableAndFilterPull(pull) {
    pull.sortBy("1", true);

    return pull.filter(([_, value]) => value);
  }
}

class Command extends BaseCommand {
  options = {
    name: "top",
    id: 16,
    media: {
      description:
        "Отображает список лидеров на сервере по различным показателям.",
      example: `!top #без аргументов`,
    },
    alias: "топ ранги rank ranks rangs лидеры leaderboard leaders лідери",
    cliParser: {
      flags: [
        {
          name: "--show-hidden",
          capture: ["--show-hidden", "-sh"],
          description: "Показывает скрытые элементы, тех, кто сокрылся",
        },
        Flag_open.FLAG_DATA,
        Flag_property.FLAG_DATA,
      ],
    },
    accessibility: {
      publicized_on_level: 3,
    },
    allowDM: true,
    cooldown: SECOND * 15,
    cooldownTry: 2,
    type: "user",
    userPermissions: PermissionsBits.EmbedLinks,
  };

  createEmbed({ context }) {
    const { pager, selected, values, PAGE_SIZE } = context;
    const { currentPage, pages } = pager;
    const pages_length = pages.length;

    const fields = values
      .slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
      .map(([user, output], index) =>
        selected.display(
          user,
          output,
          index + currentPage * PAGE_SIZE,
          context,
        ),
      );

    const executorIndex = values.findIndex(([user]) => user === context.user);

    if (!fields.length) {
      fields.push({
        name: "Ещё никто не попал в топ",
        value: "Значит вы лёгко можете стать первыми",
      });
    }

    const { user } = context;
    return {
      title:
        executorIndex !== -1
          ? `Вы находитесь на ${executorIndex + 1} месте, ${escapeMarkdown(
              user.username,
            )}`
          : `Вы не числитесь в этом топе, ${escapeMarkdown(user.username)}`,
      fields,
      author: {
        name: `Топ на сервере ${context.guild.name}・${selected.component.label}`,
        iconURL: context.guild.iconURL(),
      },
      footer:
        pages_length > 1
          ? { text: `Страница: ${currentPage + 1} / ${pages_length}` }
          : null,
    };
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  onPagerBeforePageRender(event, context) {
    Object.assign(event.value, this.createEmbed({ context }));
  }

  async onPagerComponent(interaction, context) {
    this.process_onSelectLeaderboard(interaction, context);
  }

  async process_onSelectLeaderboard(interaction, context) {
    if (interaction.customId !== "selectFilter") {
      return;
    }

    const leaderboardId = interaction.values.at(0);
    context.selected = RanksUtils.leaderboardTypes.find(
      (leaderboard) => leaderboard.component.value === leaderboardId,
    );
    context.updateValues(context);
    context.pager.updateMessage(interaction);
    return true;
  }

  async run(context) {
    const { interaction } = context;
    context.parseCli(interaction.params);
    context.createUsers();
    context.updateValues();
    context.setupPager();
    context.pager.updateMessage();
  }
}

export default Command;
export { RanksUtils };
