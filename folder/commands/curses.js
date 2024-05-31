import { justSelectMenuComponent } from "#bot/util.js";
import { MINUTE } from "#constants/globals/time.js";
import { resolve_description } from "#folder/entities/curses/curse.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { Pager } from "#lib/DiscordPager.js";
import { jsonFile } from "#lib/Discord_utils.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { ErrorsHandler } from "#lib/modules/ErrorsHandler.js";
import { toLocaleDeveloperString } from "#lib/safe-utils.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import { FormattingPatterns } from "discord.js";

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
      color: context.command.MESSAGE_THEME.color,
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
    const pages = [];
    while (contents.length) {
      const chunk = contents.splice(0, SIZE);
      pages.push(this.sendList_contentsToPage(pages, contents, chunk));
    }

    const pager = new Pager(channel);
    pager.setUser(context.user);
    pager.addPages(...pages);
    pager.updateMessage();
  }

  sendList_calculatePagesCount(pages, contentsArray) {
    return Math.ceil(
      pages.length + contentsArray.length / this.sendList_CHUNK_SIZE + 1,
    );
  }

  sendList_contentsToPage(pages, contentsArray, chunk) {
    const description = chunk.join("\n");
    return {
      description,
      footer: {
        text: `Страница ${pages.length + 1}/${this.sendList_calculatePagesCount(pages, contentsArray)}`,
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
      color: context.command.MESSAGE_THEME.color,
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
      ...context.command.MESSAGE_THEME,
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
      color: context.command.MESSAGE_THEME.color,
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
      ...context.command.MESSAGE_THEME,
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
      ...context.command.MESSAGE_THEME,
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
      color: context.command.MESSAGE_THEME.color,
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
        color: context.command.MESSAGE_THEME.color,
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
  MESSAGE_THEME = {
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
    if (this.processHelpCommand(context)) {
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

    await this.processDefaultBehavior(context);
  }
}

export default Command;
export { Help_FlagSubcommand as HelpCommandManager, Utils };
