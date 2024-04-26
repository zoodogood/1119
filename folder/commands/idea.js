// @ts-check
import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MINUTE } from "#constants/globals/time.js";
import { fetchMessagesWhile } from "#lib/fetchMessagesWhile.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { TimedCache } from "#lib/TimedCache.js";
import { jsonFile } from "#lib/Discord_utils.js";
import config from "#config";

export function getChannel() {
  return client.channels.cache.get(config.guild.ideaChannelId);
}

function parseIdeaNumber(authorField) {
  return +Util.match(authorField?.name, /#\d+$/)?.slice(1) || 0;
}

function parseAuthorName(authorField) {
  return authorField?.name.replace(/#\d+$/, "").trim();
}

function parseIdeaDescription(description) {
  return description.replace("**Идея:**", "").trim();
}

class Store extends TimedCache {
  constructor() {
    super();
  }
  fetch() {
    const channel = getChannel();
    const messages = [];
    const promise = (async () => {
      for await (const message of fetchMessagesWhile({ channel })) {
        this.emitter.emit(Store.Events.message, message);
        messages.push(message);
      }
      this.emitter.emit(Store.Events.collect_end);
    })();
    return { messages, promise };
  }

  async lastIdeaMessage() {
    return this.isCached()
      ? this.value().messages.at(0)
      : await (async () => {
          // @ts-expect-error
          const messages = await getChannel().messages.fetch();
          return messages.find((message) => message.author === client.user);
        })();
  }

  onNewIdea(message) {
    if (!this.isCached()) {
      return;
    }

    this.value().messages.unshift(message);
  }

  static Events = {
    ...super.Events,
    message: "message",
    collect_end: "collect_end",
  };
}

class JSON_Flagsubcommand {
  static FLAG_DATA = {
    name: "--json",
    capture: ["--json", "-j"],
    description: "Возвращает список идей как *.json файл",
  };
  _interface;
  store;
  messages = [];
  get ideas() {
    return this.messages.filter((message) => message.author === client.user);
  }
  constructor(context) {
    this.context = context;
    this.store = this.context.command.store;
  }

  async onProcess() {
    await this.createInterface();
    if (!this.store.isCached()) {
      const dispose = this.store.emitter.disposable(Store.Events.message, () =>
        this.onMessageCollected(),
      );
      this.store.emitter.once(Store.Events.collect_end, dispose);
    }
    const { messages, promise } = this.store.value();
    this.messages = messages;
    await promise;
    this._interface.updateMessage();
    this.sendJSON();
    return true;
  }

  sendJSON() {
    const { ideas } = this;
    const data = this.ideasToJSON(ideas);
    this.context.channel.msg({ files: [jsonFile(data, "ideas.json")] });
  }

  ideasToJSON(ideas) {
    return ideas.map((idea) => this.ideaToJson(idea));
  }

  ideaToJson(idea) {
    const [embed] = idea.embeds || [];

    if (!embed) {
      return undefined;
    }

    const { author, description } = embed;

    const index = parseIdeaNumber(author);
    if (!index || !description) {
      return undefined;
    }
    const content = parseIdeaDescription(description);
    const authorName = parseAuthorName(author);
    const reactions = idea.reactions.cache.map((reaction) => {
      const { count, emoji } = reaction;
      return { count, emoji: emoji.code };
    });
    return { index, content, reactions, authorName };
  }

  async onMessageCollected() {
    if (this.store.value().messages.length % 100 !== 0) {
      return;
    }
    await this._interface.updateMessage();
  }

  async createInterface() {
    const { context } = this;
    const _interface = new MessageInterface(context.channel);
    this._interface = _interface;
    _interface.setDefaultMessageState({
      title: "Поиск данных может занять некоторое время",
    });
    _interface.setRender(() => this.getEmbed());
    await this._interface.updateMessage();
  }

  getEmbed() {
    const { ideas } = this;
    return {
      description: ideas.length ? `Получено идей: ${ideas.length}` : null,
    };
  }
}
class CommandRunContext extends BaseCommandRunContext {
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .captureResidue({ name: "phrase" })
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
  }
}

class Command extends BaseCommand {
  store = new Store();

  async processAggree(context) {
    const { channel, user, interaction } = context;
    const heAccpet = await Util.awaitUserAccept({
      name: "idea",
      message: {
        title: "<a:crystal:637290417360076822> Подать идею",
        description:
          "После подтверждения этого сообщения, текст, который вы ввели вместе с командой, будет отправлен разработчику.\nВсё идеи попадают **[сюда.](https://discord.gg/76hCg2h7r8)**",
      },
      channel,
      userData: interaction.userData,
    });
    if (heAccpet) {
      return true;
    }
    user.msg({
      title: "Ваша идея не была отправлена, ведь Вы не подтвердили отправку",
      description: `Текст идеи:\n${interaction.params}`,
      color: "#ff0000",
    });
    return false;
  }

  async lastIdeaNumber() {
    const lastIdeaMessage = await this.store.lastIdeaMessage();
    const { author: authorField } = lastIdeaMessage?.embeds?.[0] || {};
    return parseIdeaNumber(authorField);
  }
  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.process_json_flag(context)) {
      return true;
    }
    this.processDefaultBehaviour(context);
  }

  async process_json_flag(context) {
    if (!context.cliParsed.at(1).get("--json")) {
      return false;
    }
    await new JSON_Flagsubcommand(context).onProcess();
    return true;
  }

  async processDefaultBehaviour(context) {
    if (!(await this.processAggree(context))) {
      return;
    }
    const { interaction, user } = context;
    const channel = getChannel();
    const increasedIdeaNumber = (await this.lastIdeaNumber()) + 1;
    const phrase = context.cliParsed.at(1).get("phrase");

    const message = await channel.msg({
      title: "<:meow:637290387655884800> Какая классная идея!",
      description: `**Идея:**\n${phrase}`,
      color: interaction.userData.profile_color || "#00ffaf",
      author: {
        name: `${user.username} #${increasedIdeaNumber}`,
        iconURL: user.avatarURL(),
      },
      reactions: ["814911040964788254", "815109658637369377"],
    });
    interaction.channel.msg({
      title: "<:meow:637290387655884800> Вы отправили нам свою идею! Спасибо!",
      description: `А что, идея «${phrase}» весьма не плоха...`,
      color: "#00ffaf",
      author: { name: user.username, iconURL: user.avatarURL() },
    });

    await this.store.onNewIdea(message);
  }
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  options = {
    name: "idea",
    id: 24,
    media: {
      description:
        "\n\nЕсли у вас есть идеи как можно улучшить бота — с помощью этой команды отправьте её на сервер.\nНе забудьте позже обсудить её в чате, подробно расписывая особенности вы повышаете вероятность того, что она будет реализована.\n\n\n✏️\n```python\n!idea {content}\n```\n\n",
    },
    cliParser: {
      flags: [
        {
          name: "--edit",
          capture: ["--edit", "-e"],
          expectValue: true,
          description:
            "Автор идеи может переписать её содержание за её номером",
        },
        {
          name: "--at",
          capture: ["--at"],
          expectValue: true,
          description: "Возвращает информацию об идее за её номером",
        },
        JSON_Flagsubcommand.FLAG_DATA,
      ],
    },
    alias: "идея innovation новвоведение ідея proposal предложение",
    allowDM: true,
    expectParams: true,
    cooldown: MINUTE * 10,
    cooldownTry: 3,
    type: "bot",
  };
}

export default Command;
