import { MINUTE } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { toLocaleDeveloperString } from "#lib/safe-utils.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import { ComponentType } from "discord.js";
import { AttachmentBuilder } from "discord.js";
import { FormattingPatterns } from "discord.js";

function jsonFile(data, name) {
  const buffer = Buffer.from(JSON.stringify(data, null, "\t"));
  return new AttachmentBuilder(buffer, {
    name,
  });
}
function justSelectMenuComponent({ placeholder, labels }) {
  return {
    type: ComponentType.StringSelect,
    placeholder,
    options: labels.map((label, index) => ({ label, value: String(index) })),
  };
}

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

class ListCommandManager {
  constructor(context) {
    this.context = context;
  }
  onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    this.sendList(context, context.channel);
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
    const content = bases
      .map((curse) => {
        const description =
          typeof curse.description === "function"
            ? curse.description(context.memb, { values: {} }, {})
            : curse.description;

        return `- \`${curse.id}\`\nШанс: ${curse._weight}, сложность: !${curse.hard + 1}, награда: X${curse.reward}\nОписание: ${description.replaceAll("undefined", "{X}")}.`;
      })
      .join("\n");

    channel.msg({
      description: content,
    });
  }
}

class HelpCommandManager {
  constructor(context) {
    this.context = context;
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
  getCurrentCursesContent(context) {
    const { curses } = context;

    if (!curses.length) {
      return "Нет.";
    }

    const names = curses.map((curse) => `- *\`${curse.id}\`*`).join("\n");
    const progresses = Utils.getCursesProgressContent(curses);
    return `\n${names}\n${progresses}`;
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
      description: `${contents.description} ${contents.found}\n${contents.current}\n\n**--help**\nПоказывает это меню.\n\n**--at {}**\nСокращение: \`!curses 1\`. Показывает больше информации об проклятии пользователя за номером. Вы можете упомянуть другого пользователя.\n\n**--list**\nПредоставляет перечисление всех существующих проклятий. Принимает параметр --json`,
      ...context.command.MESSAGE_THEME,
      components: curses.length
        ? justButtonComponents([
            justSelectMenuComponent({
              placeholder: `Отобразить проклятие: (их ${curses.length})`,
              labels: curses.map((curse) => curse.id),
            }),
          ])
        : {
            disabled: true,
            label: "Нет проклятий",
          },
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

  onCurseSelect(interaction, _message) {
    const value = interaction.values.at(0);
    const manager = new AtCommandManager(this.context, +value);
    const { curse, memb } = manager.getCurseByValue(+value);
    const embed = manager.createEmbed(curse, memb);
    embed.ephemeral = true;
    embed.fetchReply = true;
    manager.sendCurseEmbed(interaction, embed);
  }
}

class AtCommandManager {
  constructor(context, value) {
    this.context = context;
    this.value = value;
  }
  onProcess() {
    const { context } = this;
    if (this.processJSONFlag(context)) {
      return;
    }
    this.processSendCurse(context, context.channel);
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

  getCurseByValue(value) {
    const { memb, curses } = this.context;
    const curse = curses.at(value > 0 ? value - 1 : value);
    return { curse, memb, curses };
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
      components: justButtonComponents([
        curses.length
          ? justSelectMenuComponent({
              placeholder: `Отобразить проклятие: (их ${curses.length})`,
              labels: curses.map((curse) => curse.id),
            })
          : {
              disabled: true,
              label: "Нет проклятий",
            },
      ]),
    };
    return embed;
  }
  processSendCurse(context, channel) {
    const { value } = this;
    const { curse, memb, curses } = this.getCurseByValue(value);
    if (!curse) {
      channel.msg({
        description: `Проклятия под номером ${value} у этого человека нет, их же всего ${curses.length}!`,
        color: context.command.MESSAGE_THEME.color,
        delete: 9_000,
      });
      return;
    }

    this.sendCurseEmbed(channel, this.createEmbed(curse, memb));
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

  onCurseSelect(interaction, _message) {
    const value = interaction.values.at(0);
    const { curse, memb } = this.getCurseByValue(+value);
    const embed = this.createEmbed(curse, memb);
    embed.edit = true;
    this.sendCurseEmbed(interaction, embed);
  }
}

class CommandRunContext extends BaseCommandRunContext {
  memb = null;
  curses = [];
  user;
  channel;
  guild;

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

  static async new(interaction, command) {
    return new this(interaction, command);
  }

  constructor(interaction, command) {
    super(interaction, command);
    const { user, channel, guild } = interaction;
    Object.assign(this, { user, channel, guild });
  }
}
class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    this.run(context);
    return context;
  }

  MESSAGE_THEME = {
    color: "#1f2022",
    thumbnail:
      "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65e88daa&is=65d618aa&hm=c4c1b827a6db040cc9053682057f6c9ca6647012da687bd44fc90e4bf270eda5&=&format=webp&quality=lossless",
  };
  /**
   *
   * @param {CommandRunContext} context
   */
  async run(context) {
    context.parseCli();
    if (this.processHelpCommand(context)) {
      return;
    }

    if (this.processAtCommand(context)) {
      return;
    }

    if (this.processListCommand(context)) {
      return;
    }

    this.processDefaultBehavior(context);
  }
  processHelpCommand(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--help")) {
      return;
    }
    new HelpCommandManager(context).onProcess();
    return true;
  }

  processListCommand(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--list")) {
      return;
    }
    new ListCommandManager(context).onProcess();
    return true;
  }

  processAtCommand(context) {
    const [parsed, values] = context.cliParsed;
    const value =
      parsed.captures.get("--at")?.content.groups.value ||
      values.get("rest").match(/(?:\s*|^)-?\d+(?:\s*|$)/)?.[0];

    if (!value) {
      return;
    }
    new AtCommandManager(context, value).onProcess();
    return true;
  }
  processDefaultBehavior(context) {
    new HelpCommandManager(context).onProcess();
  }

  options = {
    name: "curses",
    id: 65,
    media: {
      description: "Даёт полезную информацию о проклятиях",
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
          capture: ["--json"],
          hidden: true,
          description: "Возвращает результат команды как *.json",
        },
      ],
    },
  };
}

export default Command;
export { HelpCommandManager, Utils };
