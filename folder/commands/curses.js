import { chunkBySize, justSelectMenuComponent, question } from "#bot/util.js";
import { Emoji } from "#constants/emojis.js";
import { HOUR, MINUTE } from "#constants/globals/time.js";
import { resolve_description } from "#folder/entities/curses/curse.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseContext } from "#lib/BaseContext.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { Pager } from "#lib/DiscordPager.js";
import {
  actionRowsToComponents,
  jsonFile,
  takeInteractionProperties,
} from "#lib/Discord_utils.js";
import CooldownManager from "#lib/modules/CooldownManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { ErrorsHandler } from "#lib/modules/ErrorsHandler.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { ending, toLocaleDeveloperString } from "#lib/safe-utils.js";
import { addResource } from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import {
  ButtonStyle,
  FormattingPatterns,
  PresenceUpdateStatus,
  escapeCodeBlock,
} from "discord.js";

class Utils {
  static getCursesProgressContent(curses) {
    return curses
      .map((curse) =>
        curse.values.goal
          ? `・${curse.values.progress || 0}/${curse.values.goal}`
          : `・${curse.values.progress || 0}`,
      )
      .join("; ");
  }
}

class List_FlagSubcommand {
  sendList_CHUNK_SIZE = 15;
  constructor(context) {
    this.context = context;
  }

  static onCommandButton({ interaction }) {
    const manager = new List_FlagSubcommand(
      new BaseContext("command.curses.list_flag.onCommandButton", {
        interaction,
        primary: interaction,
        ...takeInteractionProperties(interaction),
      }),
    );
    manager.sendList(manager.context, interaction);
  }
  async onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    await this.sendList(context, context.channel);
  }

  processJSONFlag(context) {
    const [parsed] = context.cliParsed;
    const hasJSONFlag = parsed.captures.get("--json");

    if (!hasJSONFlag) {
      return;
    }

    context.channel.msg({
      description: `Количество проклятий: ${CurseManager.cursesBase.size} .json`,
      color: Command.MESSAGE_THEME.color,
      files: [
        jsonFile(
          [...CurseManager.cursesBase.values()],
          "cursesManager_list.json",
        ),
      ],
      delete: MINUTE,
    });
    return true;
  }

  sendList(context, channel) {
    const bases = CurseManager.cursesBase;
    const contents = bases.map((base) => {
      let description;
      try {
        description = resolve_description({
          curse: { values: {} },
          user: context.user,
          curseBase: base,
        });
      } catch (error) {
        ErrorsHandler.onErrorReceive(error, {
          source: "command.curses.sendList.resolve_description",
        });
        description = `упс: ${error.message}`;
      }

      return `- \`${base.id}\`\nШанс: ${base._weight}, сложность: !${base.hard + 1}, награда: X${base.reward}\nОписание: ${description.replaceAll("undefined", "{X}")}.`;
    });

    const SIZE = this.sendList_CHUNK_SIZE;
    const pages_count = Math.floor(contents.length / this.sendList_CHUNK_SIZE);
    const list_context = {
      page_size: SIZE,
      pages_count,
      primary: context,
    };

    const pages = chunkBySize(contents, SIZE).map((chunk, index) =>
      this.sendList_contentsToPage(chunk, index, list_context),
    );

    const pager = new Pager(channel);
    pager.setUser(context.user);
    pager.addPages(...pages);
    pager.updateMessage();
  }

  sendList_calculatePagesCount(currentCount, potentialContents) {
    return Math.ceil(
      currentCount + potentialContents.length / this.sendList_CHUNK_SIZE + 1,
    );
  }

  sendList_contentsToPage(curses, currentPage, context) {
    const { pages_count } = context;
    const description = curses.join("\n");
    return {
      description,
      fetchReply: true,
      footer: {
        text: `Страница ${currentPage + 1}/${pages_count + 1}`,
      },
    };
  }
}

class Members_FlagSubcommand {
  constructor(context) {
    this.context = context;
  }

  getPull() {
    const { guild } = this.context;
    const entries = guild.members.cache
      .map(({ user }) => {
        return [user, user.data.curses];
      })
      .filter(([_user, curses]) => curses?.length);

    return entries;
  }

  onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    this.sendList(context.channel);
  }
  processJSONFlag(context) {
    const [parsed] = context.cliParsed;
    const hasJSONFlag = parsed.captures.get("--json");

    if (!hasJSONFlag) {
      return;
    }
    const pull = this.getPull().map(([user, curses]) => [
      user.username,
      curses,
    ]);
    const description = `Перечень пользователей и проклятий (${pull.length}) .json`;

    context.channel.msg({
      description,
      color: Command.MESSAGE_THEME.color,
      files: [jsonFile(Object.fromEntries(pull), "cursesManager_members.json")],
      delete: MINUTE,
    });
    return true;
  }

  async sendList(channel) {
    const { context } = this;
    const pull = this.getPull().map(([user, curses]) => [
      user.toString(),
      curses.map((curse) => `\`${curse.id}\``).join(", "),
    ]);
    const contents = {
      count: `Общее количество: ${pull.length}`,
      pull: pull.map(([user, curses]) => `- ${user}: ${curses}`).join("\n"),
      empty:
        "Ни у кого из пользователей нет проклятия. Это странно, но такое может быть.",
    };
    const description = `${contents.count}\n${
      pull.length ? contents.pull : contents.empty
    }`;

    channel.msg({
      title: "Пользователи и их проклятия",
      description,
      ...Command.MESSAGE_THEME,
    });
  }
}

class Help_FlagSubcommand {
  constructor(context) {
    this.context = context;
  }
  getCurrentCursesContent(context) {
    const { curses } = context;

    if (!curses.length) {
      return "Нет.";
    }

    const names = curses.map((curse) => `- *\`${curse.id}\`*`).join("\n");
    const progresses = Utils.getCursesProgressContent(curses);
    return `\n${names}\n${progresses}`;
  }

  onCurseSelect(interaction, _message) {
    const value = interaction.values.at(0);
    const manager = new At_FlagSubcommand(this.context, +value);
    const { curse, memb } = manager.getCurseByValue(+value);
    const embed = manager.createEmbed(curse, memb);
    embed.ephemeral = true;
    embed.fetchReply = true;
    manager.sendCurseEmbed(interaction, embed);
  }
  onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    this.sendHelp(context, context.channel);
  }

  processJSONFlag(context) {
    const [parsed] = context.cliParsed;
    const hasJSONFlag = parsed.captures.get("--json");

    if (!hasJSONFlag) {
      return;
    }

    const { curses } = context;
    const description = `Проклятия пользователя ${context.memb.toString()} (${curses.length}) .json`;

    context.channel.msg({
      description,
      color: Command.MESSAGE_THEME.color,
      files: [jsonFile(curses, "cursesManager_list.json")],
      delete: MINUTE,
    });
    return true;
  }

  async sendHelp(context, channel) {
    const contents = {
      description:
        "Проклятия — инструмент получения монет и нестабильности за скромные испытания.",
      found:
        "Найти их можно открывая пустой !сундук (с вероятностью 1:8), приобрести проклятый камень в !лавка Гремпенса или случайно получить при некоторых обстоятельствах.",
      current: `${context.memb.toString()}, Ваши текущие проклятия: ${this.getCurrentCursesContent(context)}`,
    };

    const { curses } = context;
    const message = await channel.msg({
      title: "Вызвана команда с параметром --help",
      description: `${contents.description} ${contents.found}\n${contents.current}\n\n**--help**\nПоказывает это меню.\n\n**--at {}**\nСокращение: \`!curses 1\`. Показывает больше информации об проклятии пользователя за номером. Вы можете упомянуть другого пользователя.\n\n**--list**\nПредоставляет перечисление всех существующих проклятий. Принимает параметр --json\n\n**--members**\nВозвращает перечень пользователей и проклятий`,
      ...Command.MESSAGE_THEME,
      components: justButtonComponents(
        curses.length
          ? justSelectMenuComponent({
              placeholder: `Отобразить проклятие: (их ${curses.length})`,
              labels: curses.map((curse) => curse.id),
            })
          : {
              disabled: true,
              label: "Нет проклятий",
            },
      ),
    });

    const collector = message.createMessageComponentCollector({
      time: 180_000,
    });
    collector.on("collect", (interaction) =>
      this.onCurseSelect(interaction, message),
    );
    collector.on("end", () => {
      message.msg({ components: [], edit: true });
    });
  }
}

class At_FlagSubcommand {
  constructor(context, value) {
    this.context = context;
    this.value = value;
  }
  createEmbed(curse, memb) {
    const { context } = this;
    const { curses } = context;

    const fields = this.getDefaultFields(context, curse);
    const description = CurseManager.interface({
      user: memb,
      curse,
    }).toString();

    const embed = {
      description,
      fields,
      fetchReply: true,
      ...Command.MESSAGE_THEME,
      components: justButtonComponents(
        curses.length
          ? justSelectMenuComponent({
              placeholder: `Отобразить проклятие: (их ${curses.length})`,
              labels: curses.map((curse) => curse.id),
            })
          : {
              disabled: true,
              label: "Нет проклятий",
            },
      ),
    };
    return embed;
  }

  getCurseByValue(value) {
    const { memb, curses } = this.context;
    const curse = curses.at(value);
    return { curse, memb, curses };
  }

  getDefaultFields(context, curse) {
    const curseBase = CurseManager.cursesBase.get(curse.id);
    const fields = [
      {
        name: "Прогресс:",
        value: Object.entries(curse.values)
          .map(
            ([key, value]) => `${key}: \`${toLocaleDeveloperString(value)}\``,
          )
          .join("\n"),
      },
      {
        name: "Основа:",
        value: Object.entries(curseBase)
          .map(
            ([key, value]) => `${key}: \`${toLocaleDeveloperString(value)}\``,
          )
          .join("\n"),
      },
      {
        name: "Обработчики:",
        value: Object.keys(curseBase.callback).join("\n"),
      },
      {
        name: "Другое:",
        value: `Дата создания: <t:${Math.floor(curse.timestamp / 1_000)}>`,
      },
    ];
    return fields;
  }

  onCurseSelect(interaction, _message) {
    const value = interaction.values.at(0);
    const { curse, memb } = this.getCurseByValue(+value);
    const embed = this.createEmbed(curse, memb);
    embed.edit = true;
    this.sendCurseEmbed(interaction, embed);
  }

  async onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    await this.processSendCurse(context, context.channel);
  }
  processJSONFlag(context, value) {
    const [parsed] = context.cliParsed;
    const hasJSONFlag = parsed.captures.get("--json");

    if (!hasJSONFlag) {
      return;
    }

    const { curse, memb } = this.getCurseByValue(value);
    context.channel.msg({
      description: `Проклятие ${curse.id} пользователя ${memb.toString()} .json`,
      color: Command.MESSAGE_THEME.color,
      files: [jsonFile(curse, "cursesManager_curse.json")],
      delete: MINUTE,
    });
    return true;
  }

  async processSendCurse(context, channel) {
    const { value } = this;
    const { curse, memb, curses } = this.getCurseByValue(value);
    if (!curse) {
      channel.msg({
        description: `Проклятия под номером ${value} у этого человека нет, их же всего [${curses.map((_, i) => i).join(", ")}] и нумерация начинается с нуля!`,
        color: Command.MESSAGE_THEME.color,
        delete: 15_000,
      });
      return;
    }

    await this.sendCurseEmbed(channel, this.createEmbed(curse, memb));
  }

  async sendCurseEmbed(target, embed) {
    const message = await target.msg(embed);
    if (embed.edit) {
      return;
    }
    const collector = message.createMessageComponentCollector({
      time: 180_000,
    });
    collector.on("collect", (interaction) =>
      this.onCurseSelect(interaction, message),
    );
    collector.on("end", () => {
      message.msg({ components: [], edit: true });
    });
  }
}

class Bought_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--bought",
    capture: ["--bought"],
  };
  onProcess() {
    const { user } = this.context;
    this.context.interaction.msg({
      ...Command.MESSAGE_THEME,
      title: "Проклятия можно купить за дорого",
      description:
        "Приобретение проклятия для себя стоит 90_000 коинов, для другого — 300_000 коинов",
      components: justButtonComponents(
        {
          label: "Приобрести",
          style: ButtonStyle.Success,
          customId: "@command/curses/bought_curse",
        },
        {
          label: "Список их идентификаторов",
          customId: "@command/curses/list_flag",
        },
      ),
      footer: { text: user.username, iconURL: user.avatarURL() },
    });
  }
}

class BoughtContext extends BaseContext {
  curseBase;
  prices = {
    for_self: 90_000,
    for_other: 300_000,
  };
  reasons = [];
  target;
  async onBought() {
    const { user, channel } = this.interaction;
    if (!this.processEnoughtCoins()) {
      this.responseWithReasons();
      return;
    }
    const { content } = await question({
      channel: this.interaction,
      message: {
        description:
          ":pen_ballpoint: Укажите идентификатор проклятия и, по необходимости, упомяните пользователя",
        fetchReply: true,
        color: Command.MESSAGE_THEME.color,
      },
      user,
    });

    if (!content) {
      channel.msg({
        description: "Отмена",
        color: Command.MESSAGE_THEME.color,
        delete: 15_000,
      });
    }

    const { membId, baseId } = Object.fromEntries(
      new CliParser()
        .setText(content)
        .captureByMatch({ name: "membId", regex: /\d{16,23}/ })
        .captureByMatch({ name: "baseId", regex: /[a-z_$\d]+/i })
        .collect()
        .resolveValues((capture) => capture?.toString())
        .entries(),
    );

    const curseBase = CurseManager.cursesBase.get(baseId);
    this.curseBase = curseBase;
    if (!curseBase) {
      this.reasons.push(`Такого проклятия нет: \`${baseId}\``);
    }

    const member = this.guild.members.cache.get(membId || user.id);
    this.target = member;
    if (!member) {
      this.reasons.push(`Такого пользователя не найдено: ${membId || user.id}`);
    }
    curseBase && this.processValidateCurseBase();
    member && member.id !== user.id && this.processMemberIsOffline();

    if (this.reasons.length) {
      this.responseWithReasons();
      return;
    }
    if (!this.processPay()) {
      return this.responseWithReasons();
    }

    const curse = CurseManager.generateOfBase({
      curseBase,
      user: member.user,
      context: this,
    });

    CurseManager.init({ user: member.user, curse });
    channel.msg({
      content: ":coral:",
    });

    member.user.msg({
      title: `Пользователь ${user.username} наложил на вас проклятие`,
      description: `Проклятие: \`${curseBase.id}\`\n${CurseManager.interface({ curse, user: member.user }).toString()}\nВыполните его в срок и получите коины, в ином случае потеряете уровень`,
      ...Command.MESSAGE_THEME.color,
      timestamp: Date.now(),
    });
  }
  processEnoughtCoins() {
    const { user } = this;
    const price = Math.min(...Object.values(this.prices));
    if (user.data.coins >= price) {
      return true;
    }
    this.reasons.push(
      `У вас ${ending(user.data.coins, "коин", "ов", "", "а")}. Минимальная цена проклятия: ${price} ${Emoji.coins.toString()}`,
    );
    return false;
  }
  processMemberIsOffline() {
    const { target: member } = this;
    if (
      member.presence &&
      member.presence.status !== PresenceUpdateStatus.Offline
    ) {
      return false;
    }

    this.reasons.push(
      "Невозможно наложить проклятие на пользователя, который оффлайн",
    );
    return true;
  }
  processPay() {
    const { target, user } = this;
    const price =
      target.id === user.id ? this.prices.for_self : this.prices.for_other;

    if (user.data.coins < price) {
      this.reasons.push(
        `Нужно на ${ending(price - user.data.coins, "коин", "ов", "", "а")} ${Emoji.coins.toString()} больше`,
      );
      return false;
    }

    addResource({
      user,
      resource: PropertiesEnum.coins,
      value: -price,
      source: `command.curses.bought_flag.bought.${this.curseBase.id}`,
      context: this,
    });
    return true;
  }
  processValidateCurseBase() {
    const { curseBase } = this;
    const canReceivedByOdds = !!curseBase._weight;
    const isPassFilter =
      !curseBase.filter || curseBase.filter.call(curseBase, this.user, this);
    if (canReceivedByOdds && isPassFilter) {
      return true;
    }

    if (!canReceivedByOdds) {
      this.reasons.push(
        `Можно получить только проклятия, имеющие вероятность их получения (с весом). Вес \`${curseBase.id}: ${curseBase._weight}\``,
      );
      return false;
    }

    if (!isPassFilter) {
      this.reasons.push(
        `Проклятие не прошло фильтр — его нельзя получить\n\`\`\`js\n${escapeCodeBlock(curseBase.filter.toString())}\n\`\`\``,
      );
      return false;
    }

    return false;
  }
  responseWithReasons(channel = null) {
    channel ||= this.channel;
    channel.msg({
      description: this.reasons.map((reason) => `- ${reason}`).join("\n"),
      ...Command.MESSAGE_THEME,
      delete: 15_000,
    });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  channel;
  curses = [];
  guild;
  memb = null;
  user;

  constructor(interaction, command) {
    super(interaction, command);
    const { user, channel, guild } = interaction;
    Object.assign(this, { user, channel, guild });
  }

  static async new(interaction, command) {
    return new this(interaction, command);
  }

  parseCli() {
    const parser = new CliParser().setText(this.interaction.params);

    const parsed = parser
      .processBrackets()
      .captureByMatch({ regex: FormattingPatterns.User, name: "memb" })
      .captureFlags(this.command.options.cliParser.flags)
      .captureResidueFlags()
      .captureResidue({ name: "rest" })
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);

    this.setMemb(
      parsed.captures.get("memb")?.content.groups.id ||
        this.interaction.user.id,
    );
  }

  setMemb(membId) {
    const { client } = this.interaction;
    const memb = client.users.cache.get(membId);
    this.memb = memb;
    this.curses = memb.data.curses || [];
    return this;
  }
}
class Command extends BaseCommand {
  componentsCallbacks = {
    list_flag(interaction) {
      List_FlagSubcommand.onCommandButton({ interaction });

      const current_components = actionRowsToComponents(
        interaction.message.components,
      );
      const component = current_components
        .flat()
        .find((component) => component.customId === interaction.customId);
      component.disabled = true;
      interaction.message.msg({
        edit: true,
        components: current_components,
      });
    },
    bought_curse(interaction) {
      const cooldown = CooldownManager.api(
        interaction.user.data,
        "command.curses.bought_flag.bought_CD",
        {
          heat: 3,
          perCall: HOUR,
        },
      );
      if (cooldown.checkYet()) {
        interaction.msg({
          description: `Перезарядка: ${cooldown.diff()}`,
          color: Command.MESSAGE_THEME.color,
          delete: 15_000,
        });
        return;
      }
      cooldown.call();
      const bought = new BoughtContext("command.curses.bought_flag.bought", {
        primary: interaction,
        interaction,
        ...takeInteractionProperties(interaction),
      });
      bought.onBought();
    },
  };
  static MESSAGE_THEME = {
    color: "#1f2022",
    thumbnail:
      "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65e88daa&is=65d618aa&hm=c4c1b827a6db040cc9053682057f6c9ca6647012da687bd44fc90e4bf270eda5&=&format=webp&quality=lossless",
  };

  options = {
    name: "curses",
    id: 65,
    media: {
      description: "Даёт полезную информацию о проклятиях",
      example: `!curses --help`,
    },
    alias: "проклятия проклятие curse",
    allowDM: true,
    cooldown: 4_000,
    type: "other",
    cliParser: {
      flags: [
        {
          name: "--help",
          capture: ["-h", "--help"],
          description:
            "Как просмотреть список всех проклятий и что они означают. Просмотреть проклятия пользователя",
        },
        {
          name: "--list",
          capture: ["-l", "--list"],
          description: "Предоставляет перечень всех проклятий",
        },
        {
          capture: ["--at"],
          expectValue: true,
          description:
            "Укажите номер проклятия у пользователя, чтобы получить дополнительные сведения",
        },
        {
          capture: ["--members", "-m"],
          description: "Возвращает перечень пользователей и проклятий",
        },
        {
          capture: ["--json"],
          hidden: true,
          description: "Возвращает результат команды как *.json",
        },
        Bought_FlagSubcommand.FLAG_DATA,
      ],
    },
    accessibility: {
      publicized_on_level: 7,
    },
  };
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    this.run(context);
    return context;
  }
  async processAtCommand(context) {
    const [parsed, values] = context.cliParsed;
    const value =
      parsed.captures.get("--at")?.content.groups.value ||
      values.get("rest").match(/(?:\s*|^)-?\d+(?:\s*|$)/)?.[0];

    if (!value) {
      return;
    }
    new At_FlagSubcommand(context, value).onProcess();
    return true;
  }

  async processBoughtFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--bought")) {
      return false;
    }
    await new Bought_FlagSubcommand(context).onProcess();
    return true;
  }

  async processDefaultBehavior(context) {
    return await new Help_FlagSubcommand(context).onProcess();
  }

  async processHelpCommand(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--help")) {
      return;
    }
    await new Help_FlagSubcommand(context).onProcess();
    return true;
  }
  async processListCommand(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--list")) {
      return;
    }
    await new List_FlagSubcommand(context).onProcess();
    return true;
  }

  async processMembersCommand(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--members")) {
      return;
    }
    await new Members_FlagSubcommand(context).onProcess();
    return true;
  }

  /**
   *
   * @param {CommandRunContext} context
   */
  async run(context) {
    context.parseCli();
    if (await this.processHelpCommand(context)) {
      return;
    }

    if (await this.processAtCommand(context)) {
      return;
    }

    if (await this.processListCommand(context)) {
      return;
    }

    if (await this.processMembersCommand(context)) {
      return;
    }

    if (await this.processBoughtFlag(context)) {
      return;
    }

    await this.processDefaultBehavior(context);
  }
}

export default Command;
export { Help_FlagSubcommand as HelpCommandManager, Utils };
