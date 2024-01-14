"use strict";

import * as Util from "#lib/util.js";
import DataManager from "#lib/modules/DataManager.js";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { Collection } from "@discordjs/collection";
import BossManager from "#lib/modules/BossManager.js";
import { CreateModal } from "@zoodogood/utils/discordjs";
import { CustomCollector } from "@zoodogood/utils/objectives";
import QuestManager from "#lib/modules/QuestManager.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { Emoji } from "#constants/emojis.js";

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
          const name = `${index + 1}. ${element.username}`;
          const value = `Уровень: **${
            element.data.level
          }** | Опыта: ${Util.NumberFormatLetterize(output)}`;
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
          const name = `${index + 1}. ${element.username}`;
          const value = `— ${element.data.coins} (${Util.NumberFormatLetterize(
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
          const name = `${index + 1}. ${element.username}`;
          const value = `— Был похвален ${Util.ending(
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
          const name = `${index + 1}. ${element.username}`;
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
          const name = `${cup} ${index + 1}. ${element.username}`;
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
          label: "Пережитых проклятий",
          emoji: Emoji.curse.toString(),
        },
        value: (element) => {
          return element.data.cursesEnded ?? 0;
        },
        display: (element, ended, index) => {
          const currentCount = element.curses?.length;
          const name = `${index + 1}. ${
            currentCount ? Emoji.curse.toString() : ""
          } ${element.username}`;
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
              : element.username;
          const addingName =
            (index === 0 ? " <a:neonThumbnail:806176512159252512>" : "") +
            (Util.random(9) ? "" : " <a:void:768047066890895360>");
          const name = `${index + 1}. ${username}${addingName}`;
          const value = `Использований котла ${
            Util.random(3) ? element.data.voidRituals : "???"
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
          const name = `${index + 1}. ${element.username}`;
          const value = `Великий воин нанёс ${Util.NumberFormatLetterize(
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
          const name = `${index + 1}. ${element.username}`;
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
          const name = `${index + 1}. ${element.username}`;
          const presents = element.data.presents;
          const presentsContent = presents
            ? `${Util.ending(
                presents,
                "подар",
                "ков",
                "ок",
                "ка",
              )} ${Emoji.presents.toString()}`
            : null;
          const snowflakesContent = `${Util.ending(
            presents,
            "снежин",
            "ок",
            "ка",
            "ки",
          )} ${Emoji.snowyEvent.toString()}`;
          const value = `${Util.joinWithAndSeparator([
            snowflakesContent,
            presentsContent,
          ])}`;
          return { name, value };
        },
      },
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
    // eslint-disable-next-line no-unused-vars
    return pull.filter(([_, value]) => value);
  }
}

class Command {
  PAGE_SIZE = 15;

  createComponents(context) {
    return [
      [
        {
          type: ComponentType.Button,
          label: "",
          emoji: "640449848050712587",
          customId: "previousPage",
          style: ButtonStyle.Secondary,
          disabled: context.page === 0,
        },
        {
          type: ComponentType.Button,
          label: "",
          emoji: "640449832799961088",
          customId: "nextPage",
          style: ButtonStyle.Secondary,
          disabled: context.pages <= 1 || context.page === context.pages - 1,
        },
        {
          type: ComponentType.Button,
          label: `Страница #${context.page + 1}`,
          customId: "selectPage",
          style: ButtonStyle.Secondary,
          disabled: context.pages <= 1,
        },
      ],
      [
        {
          type: ComponentType.StringSelect,
          options: RanksUtils.leaderboardTypes
            .filter(
              (leaderboard) =>
                !leaderboard.filter || leaderboard.filter(context),
            )
            .map((leaderboard) => leaderboard.component),
          customId: "selectFilter",
          placeholder: "Сменить",
        },
      ],
    ];
  }

  createEmbed({ interaction, context, edit = false }) {
    const { pages, page, selected, values } = context;
    const fields = values
      .slice(page * this.PAGE_SIZE, page * this.PAGE_SIZE + this.PAGE_SIZE)
      .map(([user, output], index) =>
        selected.display(user, output, index + page * this.PAGE_SIZE, context),
      );

    const executorIndex = values.findIndex(
      ([user]) => user === interaction.user,
    );

    if (!fields.length) {
      fields.push({
        name: "Ещё никто не попал в топ",
        value: "Значит вы лёгко можете стать первыми",
      });
    }

    return {
      title:
        executorIndex !== -1
          ? `Вы находитесь на ${executorIndex + 1} месте, ${
              interaction.user.username
            }`
          : `Вы не числитесь в этом топе, ${interaction.user.username}`,
      fields,
      edit,
      author: {
        name: `Топ на сервере ${context.guild.name}・${selected.component.label}`,
        iconURL: context.guild.iconURL(),
      },
      components: this.createComponents(context),
      footer: pages > 1 ? { text: `Страница: ${page + 1} / ${pages}` } : null,
    };
  }

  createValuesMap(context) {
    const pull = (context.sortedPull =
      context.sortedPull ?? RanksUtils.createPull(context.users));

    const resolver = context.selected.value;
    for (const entrie of pull) {
      entrie[1] = resolver(entrie[0], context) ?? 0;
    }

    return RanksUtils.sortMutableAndFilterPull(pull);
  }

  async onCollect(interaction, context) {
    if (interaction.user !== context.user) {
      interaction.msg({
        ephemeral: true,
        content: `Это взаимодействие доступно участнику ${context.user.toString()}, открывшему его. Используйте команду !топ`,
      });
      return;
    }
    const updateMessage = (replitableInteraction = interaction) => {
      context.pages = this.calculatePages(context.values.length);
      const embed = this.createEmbed({
        interaction: context.interaction,
        context,
        edit: true,
      });
      replitableInteraction.msg(embed);
    };
    await this.componentsCallbacks[interaction.customId](
      interaction,
      context,
      updateMessage,
    );
  }

  componentsCallbacks = {
    previousPage: (interaction, context, responseTo) => {
      context.page--;
      responseTo();
    },
    nextPage: (interaction, context, responseTo) => {
      context.page++;
      responseTo();
    },
    selectPage: async (interaction, context, responseTo) => {
      const user = interaction.user;
      const title = "Перейти к странице";
      const customId = "pageSelectValue";
      const components = {
        type: ComponentType.TextInput,
        style: TextInputStyle.Short,
        label: "Укажите число",
        placeholder: `От 1 до ${context.pages}`,
        customId,
      };
      const modal = CreateModal({ customId, title, components });
      await interaction.showModal(modal);

      const filter = ([interaction]) =>
        customId === interaction.customId && user === interaction.user;
      const collector = new CustomCollector({
        target: interaction.client,
        event: "interactionCreate",
        filter,
        time: 300_000,
      });
      collector.setCallback((interaction) => {
        collector.end();

        const value =
          +interaction.fields.getField("pageSelectValue").value - 1 ||
          context.page;
        context.page = Math.max(Math.min(context.pages, value), 1);
        responseTo(interaction);
        return;
      });
    },
    selectFilter: (interaction, context, responseTo) => {
      const leaderboardId = interaction.values.at(0);
      context.selected = RanksUtils.leaderboardTypes.find(
        (leaderboard) => leaderboard.component.value === leaderboardId,
      );
      context.values = this.createValuesMap(context);

      responseTo();
    },
  };

  async onChatInput(msg, interaction) {
    const users = interaction.guild.members.cache
      .map((element) => element.user)
      .filter(
        (user) =>
          user.id === interaction.user.id ||
          (!user.bot && !user.data.profile_confidentiality),
      );

    const { guild, user } = interaction;

    const context = {
      interaction,
      sortedPull: null,
      users,
      pages: null,
      page: 0,
      guild,
      boss: guild.data.boss ?? {},
      snowyEvent: guild.data.snowyEvent ?? {},
      selected: RanksUtils.leaderboardTypes.at(0),
      values: null,
      user,
    };

    context.values = this.createValuesMap(context);
    context.pages = this.calculatePages(context.values.length);

    const embed = this.createEmbed({ interaction, context, edit: false });

    context.message = await interaction.channel.msg(embed);
    const collector = context.message.createMessageComponentCollector({
      time: 180_000,
    });
    collector.on("collect", (interaction) =>
      this.onCollect(interaction, context),
    );
    collector.on("end", () => {
      context.message.msg({ components: [], edit: true });
    });
  }

  calculatePages(elementsCount) {
    return Math.ceil(elementsCount / this.PAGE_SIZE);
  }

  options = {
    name: "top",
    id: 16,
    media: {
      description:
        "\n\nОтображает список лидеров на сервере по различным показателям.\n\nСуществующие данные:\n• Количество коинов\n• Уровень\n• Похвалы\n• Успешность краж\n• Статистика квестов\n• Использование котла\n\n✏️\n```python\n!top #без аргументов\n```\n\n",
    },
    alias: "топ ранги rank ranks rangs лидеры leaderboard leaders лідери",
    allowDM: true,
    cooldown: 20_000,
    cooldownTry: 2,
    type: "user",
    Permissions: 16384n,
  };
}

export default Command;
export { RanksUtils };
