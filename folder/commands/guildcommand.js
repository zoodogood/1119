import client from "#bot/client.js";
import { awaitUserAccept, question } from "#bot/util.js";
import { code } from "#constants/app/codes.js";
import { Emoji } from "#constants/emojis.js";
import { MINUTE, SECOND } from "#constants/globals/time.js";
import { mol_tree2_string_from_json } from "#lib/$mol.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager, store } from "#lib/DataManager/singletone.js";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { Pager } from "#lib/DiscordPager.js";
import { crop_string } from "#lib/formatters.js";
import CooldownManager from "#lib/modules/CooldownManager.js";
import Template from "#lib/modules/Template.js";
import { ParserTime } from "#lib/parsers.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { escapeCodeBlock, escapeMarkdown } from "discord.js";
export function uses_count_of(custom_command_name, guild) {
  return Object.values(
    guild.data.custom_commands[custom_command_name].members,
  ).reduce((acc, [uses]) => acc + uses, 0);
}

export function guild_custom_commands_uses_count(guild) {
  return Object.values(guild.data.custom_commands).reduce(
    (acc, custom_command) => acc + uses_count_of(custom_command.name, guild),
    0,
  );
}
// MARK: CmdInstance
export class CustomCommand extends BaseCommand {
  constructor(custom_command, guild) {
    super();
    this.custom_command = custom_command;
    this.source_guild = guild;
    this.options = {
      name: custom_command.name,
      type: "custom",
      media: {
        description: custom_command.description,
      },
    };
  }

  _cooldown_api(context) {
    const { interaction } = context;
    const { options } = this;
    const command_field = this.command_field();
    command_field.members ||= [];
    const target = (command_field.members[interaction.user.id] ||= [0, 0]);
    const INDEX_OF_COOLDOWN = "1";
    return CooldownManager.api(target, INDEX_OF_COOLDOWN, {
      heat: options.cooldownTry ?? 1,
      perCall: options.cooldown,
    });
  }

  _statistic_increase(context) {
    {
      const { interaction } = context;
      const command_field = this.command_field();
      command_field.members ||= [];
      const target = (command_field.members[interaction.user.id] ||= [0, 0]);
      const INDEX_OF_COOLDOWN = "0";

      target[INDEX_OF_COOLDOWN]++;
    }
    {
      const botData = DataManager.data.bot;
      botData.commandsUsedToday ||= 0;
      botData.commandsUsedToday++;
    }
  }

  command_field() {
    return this.source_guild.data.custom_commands[this.custom_command.name];
  }

  // like eval format_object function
  format_object(object) {
    if (typeof object !== "object") {
      return String(object);
    }

    object.toString !== Object.prototype.toString &&
      Object.defineProperty(object, "toString", {
        enumerable: false,
        value: Object.prototype.toString,
      });

    return `\`\`\`tree\n${escapeCodeBlock(mol_tree2_string_from_json(object))}\`\`\``;
  }

  async onChatInput(msg, interaction) {
    const { user } = interaction;
    const source = {
      executor: user,
      empowered: user,
      type: Template.sourceTypes.custom_command,
    };
    const output = await new Template(source, interaction)
      .createVM()
      .run(this.custom_command.template || `"Привет! Попробуй !eval"`);

    interaction.msg({ content: this.format_object(output) });
  }
}

// MARK: CreateCmd
class FactoryView extends BaseFlagSubcommand {
  command_name = null;
  command_target = {};

  component_actions = {
    SwapBoolean() {},
    ApplyString() {},
  };
  pager = new Pager();
  pages_fields = [
    {
      label: "Шаг первый (обязательный). Укажите уникальное название команды",
      key: "name",
      description:
        "Название, которое отражает суть, будет более понятным для пользователей",
      type: String,
      type_hint: "^[a-zа-яёї0-9_]+$",
      validation: (value) => value.content.match(/^[a-zа-яёї0-9_]+$/),
      validation_error:
        "Название команды не удовлетворяет паттерну — дословно последовательности символов допускающей символы от «a» до «z» ∪ «а-я» (плюс ёъ) ∪ 0-9 ∪ «_», где «^» и «$» — обозначают начало и конец строки",
      callback: (name) => {
        const previous = this.wire.value[name];
        if (
          previous &&
          !this.command_is_allow_rewrite(
            this.wire.value[name],
            this.command_target,
          )
        ) {
          this.context.channel.msg({
            description: `Такая команда уже существует и находится под управлением другого пользователя ${client.users.resolve(previous.command_author_id)}`,
          });
          return code.PermissionDenide;
        }
        this.command_author_id = this.context.user.id;
        this.command_target = this.wire.value[name] ||= {
          ...this.command_target,
        };
        this.command_name = name;
      },
      default: () => this.command_name || null,
      required: true,
    },
    {
      label: "Шаг второй. Вызываемое JavaScript выражение",
      key: "template",
      description:
        "Название, которое отражает суть, будет более понятным для пользователей",
      type: String,
      required: true,
    },
    {
      label: "Вы можете добавить описание",
      key: "description",
      description:
        "Пользователи смогут узнать как пользоваться вашей командой через !commandinfo",
      default: () => "Для этой пользовательской команды не назначено описания",
      type: String,
    },
    {
      label: "Вы можете добавить описание",
      key: "description",
      description:
        "Пользователи смогут узнать как пользоваться вашей командой через !commandinfo",
      default: () => "Для этой пользовательской команды не назначено описания",
      type: String,
    },
    {
      label: "Перезарядка",
      key: "cooldown",
      description:
        "Ограничивает как часто пользователи могут применять команду. Второй параметр «накоплений» соотвествует стандартному поведению во многих командах бота, разрешая использовать команду несколько раз подряд, но перезарядка накапливается",
      type_hint: "Время и через пробел число",
      validation: (message) =>
        new RegExp(`${ParserTime.regex.source}`).test(message.content),
      validation_error: `Ожидалось время и через пробел число`,
      type: String,
      default: () => "5с 1",
    },
    {
      label: "Отображать внутри !help",
      key: "hidden",
      description:
        "По умолчанию все пользовательские команды можно посмотреть в !help",
      type: Boolean,
      default: () => false,
    },
  ];
  pages_system = [
    {
      label: "Навигация (вы здесь)",
      callback: () => ({
        title: "Навигация",
        fetchReply: true,
        description: [...this.pages_system, ...this.pages_fields]
          .map(
            (page, i) =>
              `- ${i + 1}. ${page.label}${page.key && this.command_target[page.key] ? `. ${Emoji.animation_tick_block} ${crop_string(String(this.command_target[page.key], 20))}` : ""}`,
          )
          .join("\n"),
      }),
    },
  ];
  command_get_field_value(field_base) {
    return (
      (this.command_target[field_base.key] || field_base.default?.()) ?? "нет"
    );
  }
  command_is_allow_rewrite(original, rewrite) {
    return original.command_author_id === rewrite.command_author_id;
  }
  async getEmbed() {
    const { pages_system } = this;
    const { currentPage } = this.pager;
    if (this.pages_current_page_is_system()) {
      return pages_system[currentPage].callback.call(this);
    }
    const field_base = this.pages_resolve_field_page(currentPage);

    return {
      fetchReply: true,
      description: `${Math.random()}\n### ${field_base.label}\n\n-# ${field_base.description}\n\nТекущее значение: ${this.command_get_field_value(field_base)}\n\n:wrench: — поменять значение`,
      footer: {
        text: `Параметр: ${field_base.key} | !${this.command_name || "<ред._команда>"}`,
      },
    };
  }
  modify_button_is_disabled() {
    return this.pages_current_page_is_system();
  }
  async modify_button_process(interaction) {
    if (interaction.customId !== "modify") {
      return false;
    }
    const { currentPage } = this.pager;
    const field_base = this.pages_resolve_field_page(currentPage);
    const description_base = () =>
      `Ожидается новое значение типа ${field_base.type.name}${field_base.type_hint ? ` \`(${field_base.type_hint})\`` : ""}`;
    const base_question = {
      validation_hint: field_base.validation_error,
      validation: field_base.validation,
      channel: interaction,
      listen_components: true,
      user: interaction.user,
      message: {
        description: description_base(),
        fetchReply: true,
      },
    };

    const value = await (async () => {
      switch (field_base.type) {
        case String: {
          const { content } = await question({
            ...base_question,
          });
          return content;
        }
        case Boolean: {
          const { isComponent } = await question({
            ...base_question,
            message: {
              components: justButtonComponents({}),
            },
          });
          return content;
        }
        default:
          throw new TypeError("Unknown type");
      }
    })();

    if (!value) {
      return true;
    }

    const response = await field_base.callback?.(value);

    this.command_target[field_base.key] = value;
    this.wire.publish();
    return true;
  }
  async onCollect({ interaction }) {
    return await this.modify_button_process(interaction);
  }
  async onProcess() {
    this.wire = CommandRunContext.prototype.wire.call(this.context);
    this.setupPager();
    this.pager.updateMessage();
  }
  pages_current_page_is_system() {
    const { currentPage } = this.pager;
    return currentPage < this.pages_system.length;
  }
  pages_resolve_field_page(currentPage) {
    const { pages_system } = this;
    return this.pages_fields[currentPage - pages_system.length];
  }
  setupPager() {
    const { pager, context } = this;
    pager.setPagesLength(this.pages_fields.length);
    pager.setChannel(context.interaction);
    pager.setUser(context.user);
    pager.setRender(() => this.getEmbed());
    pager.spliceComponents(
      -1,
      0,
      (() => {
        const [component] = justButtonComponents({
          emoji: "🔧",
          customId: "modify",
        });
        Object.defineProperty(component, "disabled", {
          get: () => {
            return this.modify_button_is_disabled();
          },
          enumerable: true,
        });

        return [component];
      })(),
    );
    pager.emitter.on(Pager.Events.allowed_collect, this.onCollect.bind(this));
    {
      const disposable = this.wire.subscribe(() => pager.updateMessage());
      pager.emitter.on(Pager.Events.before_close, () => disposable());
    }
  }
}

// MARK: GeneralView
class DefaultView extends BaseFlagSubcommand {
  _interface = new MessageInterface();
  async getEmbed() {
    const { length: commands_count } = Object.keys(this.context.wire().value);
    return {
      title: "Список команд",
      components: justButtonComponents(
        ...[
          commands_count < 3 && {
            label: "Создать",
            customId: "@command/guildcommand/create",
          },
          commands_count > 0 && {
            label: "Настроить",
            customId: "@command/guildcommand/edit",
          },
          commands_count > 0 && {
            label: "Удалить",
            customId: "@command/guildcommand/remove",
          },
        ].filter(Boolean),
      ),
      description:
        "===============================================\n" +
        (Object.keys(this.context.wire().value)
          .map((name) => {
            return `- ${name}`;
          })
          .join("\n") || "Команд нет") +
        "\n===============================================",
      footer: {
        text: "Оптимальный способ вызова редактирования команды: !custom --target <command_name>",
      },
    };
  }

  async onProcess() {
    const { interaction } = this.context;

    this._interface.setChannel(interaction.channel);
    this._interface.setRender(async () => await this.getEmbed());
    this._interface.updateMessage();
  }
}
class CommandDefaultBehaviour extends BaseFlagSubcommand {
  async onProcess() {
    const { context } = this;
    const wire = context.wire();
    const view = new DefaultView(context);
    await view.onProcess();
    const disposable = wire.subscribe(() => view._interface.updateMessage());
    view._interface.emitter.on(MessageInterface.Events.before_close, () =>
      disposable(),
    );
  }
}

// MARK: Context
class CommandRunContext extends BaseCommandRunContext {
  wire() {
    this.guild.data.custom_commands ||= {};
    const wire = store.hold_wire(this.guild.data, "custom_commands");
    return wire;
  }
}
class Command extends BaseCommand {
  componentsCallbacks = {
    create: (context) => {
      new FactoryView(context).onProcess();
    },
    /**
     *
     * @param {CommandRunContext} context
     */
    remove: async (context) => {
      const { interaction } = context;
      const { channel, user } = interaction;
      const wire = CommandRunContext.prototype.wire.call(context);

      const _interface = new MessageInterface(interaction);
      _interface.setRender(() => {
        const names = Object.keys(wire.value);
        if (!names.length) {
          setTimeout(() => _interface.close(), 5 * SECOND);
        }
        return {
          title: names.length
            ? "Отправьте номер команды, которую хотите удалить"
            : "Это окно сейчас закроется",
          fetchReply: true,
          description:
            names
              .map((name, i) => {
                return `-# \`#${i + 1}\` — **${escapeMarkdown(name)}**`;
              })
              .join("\n") || "Команд нет",
        };
      });
      _interface.updateMessage();
      const disposable = wire.subscribe(() => _interface.updateMessage());
      _interface.emitter.on(MessageInterface.Events.before_close, () =>
        disposable(),
      );

      const answer = (
        await channel.awaitMessages({
          max: 1,
          filter: (message) => message.author.id === user.id,
          time: MINUTE,
        })
      )?.first();

      const { content: index } = answer;
      answer.delete();
      _interface.close();
      const names = Object.keys(wire.value);

      const by_name = names[index - 1];
      if (!by_name) {
        interaction.channel.msg({
          color: "#ff0000",
          title: "Команда не найдена",
          delete: 8_000,
        });
        return;
      }
      delete wire.value[by_name];
      wire.publish();

      interaction.channel.msg({
        title: "Удаление",
        description: `Удалена команда ${by_name}. Нажмите реакцию, чтобы вернуть`,
        delete: 8_000,
      });
    },
  };

  options = {
    name: "guildcommand",
    id: 36,
    media: {
      description:
        "Создание пользовательских команд на сервере — ещё один этап к многофункциональной системе шаблонов и переменных сервера, обязательно комбинируйте эти технологии\n_устарело*_",
      example: `!guildCommand #без аргументов`,
    },
    alias:
      "guildcommands createcommand командасерверу командасервера customcommand custom",
    allowDM: true,
    type: "guild",
  };

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));

    return context;
  }

  /**
   *
   * @param {CommandRunContexts} context
   */
  async run(context) {
    const { channel, user } = context;
    const heAccpet = await awaitUserAccept({
      name: "guildCommand",
      message: {
        description:
          'Здравствуйте, эта команда очень универсальна и проста, если её не боятся конечно. Она поможет вам создать свои собсвенные команды основанные на "[Шаблонных строках](https://discord.gg/7ATCf8jJF2)".\nЕсли у вас возникнут сложности, обращайтесь :)',
        title: "Команда для создания команд 🤔",
      },
      channel,
      userData: user.data,
    });
    if (!heAccpet) return;

    await new CommandDefaultBehaviour(context).onProcess();
  }
}

export default Command;
