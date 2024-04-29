import { question } from "#bot/util.js";
import { Emoji } from "#constants/emojis.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { util_store_and_send_audit } from "#lib/modules/ErrorsHandler.js";
import Template from "#lib/modules/Template.js";
import { DotNotatedInterface } from "@zoodogood/utils/objectives";

class CommandRunContext extends BaseCommandRunContext {
  intefaceMessage;
  guildData;

  static new(interaction, command) {
    const context = new this(interaction, command);
    context.guildData = interaction.guild.data;
    return context;
  }

  setInterfaceMessage(message) {
    this.intefaceMessage = message;
  }

  parseCli() {}

  get randomEmoji() {
    return (this._randomEmoji ||= ["🔧", "🔨", "💣", "🛠️", "🔏"].random());
  }
}
class Command_GuildChannels_Manager {
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { user, channel } = this.context;
    await question({
      reactions: this.CHANNELS.map(({ emoji }) => emoji),
      channel,
      user,
      message: {
        fields: [
          {
            name: "Каналы",
            value: this.CHANNELS.map((channelBase) =>
              this.channelBaseToString(channelBase),
            ).join("\n"),
          },
        ],
      },
    });
  }

  channelBaseToString(channelBase) {
    const { guildData, guild } = this.context;

    const value = this.isChannelInstalled(guild, channelBase)
      ? this.getChannelOfChannelBase(guild, channelBase).toString()
      : channelBase.key in guildData
        ? "не найден"
        : "не установлен";

    return `${channelBase.emoji} ${channelBase.label}: ${value}`;
  }

  getChannelOfChannelBase(guild, channelBase) {
    return guild.channels.cache.get(guild.data[channelBase.key]);
  }

  processChannelIsExists(channel, channelBase) {
    if (channel) {
      return true;
    }
    const { guild } = this.context;
    delete guild.data[channelBase.key];
  }
  isChannelInstalled(guild, channelBase) {
    return !!this.getChannelOfChannelBase(guild, channelBase);
  }

  CHANNELS = [
    {
      key: "chatChannel",
      label: "Чат",
      emoji: "🔥",
    },
    {
      key: "logChannel",
      label: "Для логов",
      emoji: "📒",
    },
    {
      key: "hiChannel",
      label: "Для приветствий",
      emoji: "👌",
    },
  ];
}

class Command_GuildBanner_Manager {
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { context } = this;
    const { user, channel, guild } = context;
    const { content } = await question({
      user,
      channel,
      message: { title: "Укажите ссылку на изображение", description: "Апчхи" },
    });

    if (!content) {
      return;
    }

    if (!this.processContentIsLink(content, context)) {
      return;
    }

    guild.data.banner = content;
    channel.msg({
      title: "Баннер установлен!",
      delete: 7_000,
      image: guild.data.banner,
    });
  }
  processContentIsLink(content, context) {
    if (content.startsWith("http")) {
      return true;
    }

    const { channel } = context;
    channel.msg({
      title: "Вы должны были указать ссылку на изображение",
      color: "#ff0000",
      delete: 3000,
    });
  }
}

class Command_GuildDescription_Manager {
  TEMPLATE_KEY_PREFIX = "_i_know_how_work_with_eval";
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { context } = this;
    const { user, channel, guild } = context;
    let { content } = await question({
      user,
      channel,
      message: {
        title: "Введите описание вашего чудесного сервера",
        description: `Если вы готовы использовать JavaScript код, начните описание с ключевого префикса: ${this.TEMPLATE_KEY_PREFIX} :green_heart:`,
      },
    });

    if (this.processTimeEnd(content, context)) {
      return;
    }

    const isTemplate =
      content.startsWith(this.TEMPLATE_KEY_PREFIX) &&
      (content = content.replace(this.TEMPLATE_KEY_PREFIX, "").trim());

    const guildData = guild.data;
    guildData.description ||= {};
    guildData.description.content = content;
    isTemplate &&
      Object.assign(guildData.description, { isTemplate, authorId: user.id });

    const resolveTemplate = (content) => {
      const templater = new Template({
        executor: user,
        type: Template.sourceTypes.involuntarily,
      });
      return templater.createVM().run(content);
    };

    const description = isTemplate ? await resolveTemplate(content) : content;
    channel.msg({
      title: "Описание установлено! Юху!",
      delete: 7_000,
      description,
    });
  }

  processTimeEnd(answer, context) {
    if (answer) {
      return false;
    }

    const { channel } = context;
    channel.msg({
      title: "Время вышло ⏰",
      color: "#ff0000",
      delete: 7_000,
    });
    return true;
  }
}

class Command_GuildSetHello_Manager {
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { interaction } = this.context;
    const { message } = interaction;
    await CommandsManager.callMap
      .get("sethello")
      .onChatInput(message, interaction);
  }
}

class Command_GuildPartners_Manager {
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { interaction } = this.context;
    const { message } = interaction;
    await CommandsManager.callMap
      .get("partners")
      .onChatInput(message, interaction);
  }
}

class Command_GuildChatFilter_Manager {
  constructor(context) {
    this.context = context;
  }

  emojiEnum = {
    enable: "685057435161198594",
    disable: "763804850508136478",
  };

  async onProcess() {
    const { user, channel, guild } = this.context;
    const { emoji } = await question({
      user,
      channel,
      message: {
        title: "Включить фильтр чата?",
        description:
          'Подразумивается удаление сообщений которые содержат: рекламу, нецензурную лексику, капс и т.д.\nСейчас эта функция является "сырой" и будет продолжать развиваться со временем',
      },
      reactions: [this.emojiEnum.enable, this.emojiEnum.disable],
    });

    const guildData = guild.data;
    if (emoji === this.emojiEnum.enable) {
      guildData.chatFilter = 1;
      channel.msg({ title: "Фильтр включён", delete: 7_000 });
      return;
    }

    if (emoji === this.emojiEnum.disable) {
      guildData.chatFilter = 0;
      channel.msg({ title: "Фильтр выключен", delete: 3000 });
      return;
    }
  }
}

class CommandDefaultBehavior {
  constructor(context) {
    this.context = context;
    this.command = this.context.command;
  }
  async onProcess() {
    const { context } = this;
    const { channel } = context;
    /**@type {import("discord.js").Message} */
    const message = await channel.msg(this.createEmbed(context));

    const collector = message.createReactionCollector();
    collector.on("collect", (reaction, user) => {
      this.onReaction(reaction, user, context).catch(
        util_store_and_send_audit.bind(null, context),
      );
    });
    collector.on("end", () => {
      message.reactions.removeAll();
    });
    context.setInterfaceMessage(message);
  }

  async onReaction(reaction, user, context) {
    const { emoji } = reaction;
    if (!this.processUserCanUseReaction(user, context)) {
      return;
    }

    await context.channel.msg({ content: String(emoji), delete: 5_000 });
    this.command.SETTING_FIELDS.find(
      (field) => field.emoji === emoji.name,
    )?.onReaction(reaction, user, context);
  }

  processUserCanUseReaction(user, context) {
    if (user === context.user) {
      return true;
    }

    return false;
  }

  createEmbed(context) {
    const emoji = context.randomEmoji;
    return {
      title: `Настроим сервер?... ${emoji}`,
      description: this.createDescription(context),
      reactions: this.command.SETTING_FIELDS.map((field) => field.emoji),
    };
  }

  createDescription(context) {
    const { guild, command } = context;
    const guildData = guild.data;
    const channels = new Command_GuildChannels_Manager(context);

    const channelContent = channels.CHANNELS.map((channelBase) =>
      channels.channelBaseToString(channelBase),
    ).join("\n");

    const on_emoji = Emoji.animation_tick_block.toString();
    const target = new DotNotatedInterface(guildData);

    const instrumentsContent = command.SETTING_FIELDS.map(
      ({ key, label_on, label_off, emoji }) =>
        target.hasItem(key)
          ? `${on_emoji} ${label_on}`
          : `${emoji} ${label_off}`,
    ).join("\n");

    return `Каналы:\n${channelContent}\nИнструменты:\n${instrumentsContent}`;
  }
}

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async run(context) {
    context.parseCli();
    await this.processDefaultBehavior(context);
  }

  /**
   * Process the default behavior using the provided context.
   * @param {CommandRunContext} context - the context object containing channel information
   */
  async processDefaultBehavior(context) {
    await new CommandDefaultBehavior(context).onProcess();
  }

  SETTING_FIELDS = [
    {
      key: "description",
      emoji: "🪧",
      label_off: "Настроить описание сервера",
      label_on: "Описание сервера удачно настроено",
      onReaction(reaction, user, context) {
        new Command_GuildDescription_Manager(context).onProcess();
      },
    },
    {
      key: "banner",
      emoji: "🌌",
      label_off: "Установите баннер",
      label_on: "На сервере есть свой баннер!",
      onReaction(reaction, user, context) {
        new Command_GuildBanner_Manager(context).onProcess();
      },
    },
    {
      key: "chatFilter",
      emoji: "🚸",
      label_off: "Фильтр чата выключен",
      label_on: "Фильтр чата включён :)",
      onReaction(reaction, user, context) {
        new Command_GuildChatFilter_Manager(context).onProcess();
      },
    },
    {
      key: "partners.isEnable",
      emoji: "🪂",
      label_off: "Можно запустить партнёрства",
      label_on: "Партнёрства включены",
      onReaction(reaction, user, context) {
        new Command_GuildPartners_Manager(context).onProcess();
      },
    },
    {
      key: "hi",
      emoji: "👋",
      label_off: "Не настроено приветсвие новых участников",
      label_on: "«Привет тебе, новый участник»",
      onReaction(reaction, user, context) {
        new Command_GuildSetHello_Manager(context).onProcess();
      },
    },
  ];

  options = {
    name: "editserver",
    id: 29,
    media: {
      description:
        "Настройки сервера (бот) — Фильтр чата, канал логов, основной чат, описание и баннер для команды `!сервер` — способы управления сервером.",
      example: `!editserver #без аргументов`,
    },
    alias: "настроитьсервер серватиус servatius налагодитисервер серватіус",
    allowDM: true,
    type: "guild",
    Permissions: 32n,
  };
}

export default Command;

// const { guild, interaction } = context;
//     const guildData = guild.data;
//     const settingsAll = [

//     settings = settingsAll.map(([key, setup_off, setup_on]) =>
//       guildData[key] ? "<a:yes:763371572073201714> " + setup_on : setup_off,
//     );

//     let message = await context.channel.msg({
//       title: "Идёт Настройка сервера... " + randomEmoji,
//       description: settings.join("\n"),
//       footer: { text: "🔂 - отобразить все действия" },
//       fields: [{ name: "🏝️ Назначенные каналы", value: channelsContent }],
//     }),
//       react = await message.awaitReact(
//         { user, removeType: "all" },
//         ...settings
//           .map((e) => e.split(" ")[0])
//           .filter((e) => e !== "<a:yes:763371572073201714>"),
//         "🏝️",
//         "🔂",
//       ),
//       settings = settingsAll.map((e) =>
//         guildData[e[0]] ? "<a:yes:763371572073201714> " + e[2] : e[1],
//       );
//     message = await message.msg({
//       title: "Идёт Настройка сервера... " + randomEmoji,
//       description: settings.join("\n"),
//       footer: { text: "🔂 - отобразить все действия" },
//       edit: true,
//       fields: [{ name: "🏝️ Назначенные каналы", value: channels }],
//     });
//     reactions = reactions || [
//       ...settings
//         .map((e) => e.split(" ")[0])
//         .filter((e) => e != "<a:yes:763371572073201714>"),
//       "🏝️",
//       "🔂",
//     ];
//     react = await message.awaitReact(
//       { user: user, removeType: "all" },
//       ...reactions,
//     );
