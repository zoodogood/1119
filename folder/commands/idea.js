// @ts-check
import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MINUTE, SECOND } from "#constants/globals/time.js";
import { fetchMessagesWhile } from "#lib/fetchMessagesWhile.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { TimedCache } from "#lib/TimedCache.js";
import { jsonFile } from "#lib/Discord_utils.js";
import config from "#config";
import { Pager } from "#lib/DiscordPager.js";
import { Collection } from "@discordjs/collection";

export function getChannel() {
  return client.channels.cache.get(config.guild.ideaChannelId);
}

function parseIdeaNumber(authorField) {
  if (!authorField) {
    return;
  }
  return +Util.match(authorField.name, /#\d+$/)?.slice(1) || 0;
}

function parseAuthorName(authorField) {
  return authorField?.name.replace(/#\d+$/, "").trim();
}

function parseIdeaDescription(description) {
  return description.replace("**Идея:**", "").trim();
}

class Loader {
  _interface = new MessageInterface();
  store;
  storeValue;

  constructor(context) {
    this.context = context;
    this.store = this.context.command.store;
    this.storeValue = this.context.storeValue;
  }

  async process_wait_load() {
    await this.createInterface();
    if (!this.store.isCached()) {
      const dispose = this.store.emitter.disposable(Store.Events.idea, () =>
        this.onMessageCollected(),
      );
      this.store.emitter.once(Store.Events.collect_end, dispose);
    }
    const { promise } = this.storeValue;
    await promise;
    this._interface.updateMessage();
  }

  ideas() {
    return this.storeValue.ideas;
  }

  async onMessageCollected() {
    if (this.storeValue.ideas.size % 100 !== 0) {
      return;
    }
    await this._interface.updateMessage();
  }

  async createInterface() {
    const { context, _interface } = this;
    _interface.setChannel(context.channel);
    _interface.setDefaultMessageState({
      title: "Поиск данных может занять некоторое время...",
      color: Command.MESSAGE_THEME.color,
    });
    _interface.setRender(() => this.getEmbed());
    await this._interface.updateMessage();
  }

  getEmbed() {
    const { ideas } = this.storeValue;
    return {
      description: ideas.size ? `Получено идей: ${ideas.size}` : null,
    };
  }
}

class Store extends TimedCache {
  constructor() {
    super();
  }
  fetch() {
    const channel = getChannel();
    const ideas = new Collection();
    const promise = (async () => {
      for await (const message of fetchMessagesWhile({ channel })) {
        this.process_message(message);
      }
      this.emitter.emit(Store.Events.collect_end);
    })();
    return { ideas, promise, isSorted: false };
  }

  process_message(message) {
    if (!this.isCached()) {
      return;
    }
    this.emitter.emit(Store.Events.message, message);

    const { ideas } = this.value();
    const metadata = this.idea_parse_metadata(message);
    if (!metadata) {
      return;
    }
    this.value().isSorted = false;
    this.emitter.emit(Store.Events.idea, { message, metadata });
    ideas.set(metadata.index, metadata);
  }

  idea_parse_metadata(message) {
    const { embed, id } = message;
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
    const reactions = message.reactions.cache.map((reaction) => {
      const { count, emoji } = reaction;
      return { count, emoji: emoji.code };
    });
    return {
      index,
      content,
      reactions,
      authorName,
      authorIconURL: author.iconURL,
      id,
    };
  }

  async sort() {
    if (!this.isCached()) {
      return;
    }
    const { ideas, isSorted, promise } = this.value();
    if (isSorted) {
      return;
    }
    await promise;
    ideas.sort((b, a) => a.index - b.index);
    this.value().isSorted = true;
  }

  async lastIdea() {
    return this.isCached()
      ? this.value().ideas.at(0)
      : await (async () => {
          // @ts-expect-error
          const messages = await getChannel().messages.fetch();
          const message = messages.find(
            (message) => message.author === client.user,
          );
          return this.idea_parse_metadata(message);
        })();
  }

  onNewIdea(message) {
    this.process_message(message);
  }

  static Events = {
    ...super.Events,
    message: "message",
    idea: "idea",
    collect_end: "collect_end",
  };
}

class JSON_Flagsubcommand {
  static FLAG_DATA = {
    name: "--json",
    capture: ["--json", "-j"],
    description: "Возвращает список идей как *.json файл",
  };

  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const loader = new Loader(this.context);
    await loader.process_wait_load();
    this.ideas = loader.ideas();
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
    return idea;
  }
}

class At_Flagsubcommand {
  static FLAG_DATA = {
    name: "--at",
    capture: ["--at"],
    expectValue: true,
    description: "Возвращает информацию об идее за её номером",
  };
  pager;
  value;
  store;
  constructor(context, value) {
    this.context = context;
    this.store = this.context.command.store;
    this.value = value - 1;
    this.pager = new Pager(context.channel);
  }
  async onProcess() {
    if (!this.process_validate_value()) {
      return true;
    }
    const loader = new Loader(this.context);
    await loader.process_wait_load();
    this.ideas = loader.ideas();
    await this.createInterface();
    return true;
  }

  process_validate_value() {
    const { value } = this;
    if (!isNaN(value)) {
      return true;
    }

    this.context.channel.msg({
      description: "Значение флага --at должно быть числом",
      delete: 8 * SECOND,
      color: Command.MESSAGE_THEME.color,
    });
  }

  createInterface() {
    const { pager } = this;
    pager.currentPage = this.value;
    pager.setDefaultMessageState({
      color: Command.MESSAGE_THEME.color,
    });
    pager.setPagesLength(Math.max(...this.ideas.keys()));
    pager.setRender(() => this.messageOptionsOfCurrent());
    pager.updateMessage();
  }

  messageOptionsOfCurrent() {
    const { pager, ideas, store } = this;
    const { currentPage } = pager;
    const ideaIndex = currentPage + 1;
    const idea = ideas.get(ideaIndex);
    if (!idea) {
      store.sort();

      const index = (() => {
        const generator = Util.zeroCenteredSequence();
        const keys = [...ideas.keys()];
        const LIMIT = 200;
        while (true) {
          const { value = 200 } = generator.next();
          if (value >= LIMIT) {
            return;
          }

          if (ideas.get(ideaIndex + value)) {
            return keys.indexOf(ideaIndex + value);
          }
        }
      })();
      const description = `Ап-ап-ап. Не получилось получить данные идеи. Ближе всего идеи (доступные): ${
        Util.around([...ideas.keys()], index, 5)
          .concat([index])
          .join(", ") || "*Идей не найдено вовсе*"
      }`;
      return { description, title: `Идея #${ideaIndex}` };
    }

    const { ideasChannel } = this.context;
    return {
      description: `<:meow:637290387655884800> Классная идея:\n${idea.content}`,
      fields: [
        {
          name: `Перейти к сообщению`,
          value: `https://discord.com/channels/${ideasChannel.guild.id}/${ideasChannel.id}/${idea.id}`,
        },
        {
          name: "Реакции",
          value:
            idea.reactions
              .map(
                ({ count, emoji }) =>
                  `${client.emojis.resolve(emoji)?.toString() || emoji} | ${count}`,
              )
              .join("\n") || "Пусто",
        },
      ],
      author: {
        name: `${idea.authorName} #${ideaIndex}`,
        iconURL: idea.authorIconURL,
      },
    };
  }
}

class Edit_Flagsubcommand {
  static FLAG_DATA = {
    name: "--edit",
    capture: ["--edit", "-e"],
    expectValue: true,
    description: "Автор идеи может переписать её содержание за её номером",
  };
  pager;
  value;
  store;
  targetMessage;
  constructor(context, value) {
    this.context = context;
    this.value = +value;
    this.pager = new Pager(context.channel);
  }
  async onProcess() {
    if (!this.process_validate_value()) {
      return true;
    }
    const loader = new Loader(this.context);
    await loader.process_wait_load();
    if (
      !this.process_validate_value() ||
      !(await this.fetchMessage()) ||
      !this.process_validate_permission()
    ) {
      return;
    }

    await this.editMessage();
    return true;
  }

  async fetchMessage() {
    const { ideasChannel, storeValue } = this.context;
    const message = await ideasChannel.messages.fetch(
      storeValue.ideas.get(this.value)?.id,
    );
    if (!this.process_idea_exists(message)) {
      return false;
    }
    this.targetMessage = message;
    return true;
  }

  process_idea_exists(message) {
    if (message) {
      return true;
    }

    this.context.channel.msg({
      description: "Идея с указанным номером не существует",
      delete: 8 * SECOND,
      color: Command.MESSAGE_THEME.color,
    });
    return false;
  }

  process_validate_permission() {
    const { targetMessage, context } = this;
    const { user } = context;
    const author_id =
      targetMessage.embed.author.iconURL.match(/\d{17,22}/)?.[0];
    const isSame = author_id === user.id;
    const isUserModerator = config.developers.includes(user.id);
    if (isSame || isUserModerator) {
      return true;
    }

    const idea_author = client.users.cache.get(author_id);
    this.context.channel.msg({
      description: `Автором идеи является ${idea_author?.username || null}`,
      delete: 8 * SECOND,
      color: Command.MESSAGE_THEME.color,
    });
  }

  process_validate_value() {
    const { value } = this;
    if (!isNaN(value)) {
      return true;
    }

    this.context.channel.msg({
      description:
        "Значение флага --edit должно быть числом и указывать на целевую идею",
      delete: 8 * SECOND,
      color: Command.MESSAGE_THEME.color,
    });
  }

  async editMessage() {
    const { targetMessage } = this;
    const { embed } = targetMessage;
    const { title, color, author } = embed;
    await targetMessage.msg({
      title,
      color,
      author,
      description: this.context.cliParsed.at(1).get("phrase"),
      edit: true,
    });

    this.context.channel.msg({
      title: "Идея отредактирована!",
      description: `Старое содержание:\n${embed.description}`,
    });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  _storeValue;
  _ideasChannel;
  get storeValue() {
    return (this._storeValue ||= this.command.store.value());
  }
  get ideasChannel() {
    return getChannel();
  }
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

  static MESSAGE_THEME = {
    color: "#00ffaf",
  };

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
    const { index } = (await this.store.lastIdea()) || {};
    return index || 0;
  }
  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.process_json_flag(context)) {
      return true;
    }
    if (await this.process_at_flag(context)) {
      return true;
    }
    if (await this.process_edit_flag(context)) {
      return true;
    }
    this.processDefaultBehaviour(context);
  }

  async process_edit_flag(context) {
    const value = context.cliParsed.at(1).get("--edit");
    if (!value) {
      return false;
    }
    await new Edit_Flagsubcommand(context, value).onProcess();
    return true;
  }

  async process_at_flag(context) {
    const value = context.cliParsed.at(0).captures.get("--at")?.valueOfFlag();
    if (!value) {
      return false;
    }
    await new At_Flagsubcommand(context, value).onProcess();
    return true;
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
      color: Command.MESSAGE_THEME.color,
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
        Edit_Flagsubcommand.FLAG_DATA,
        At_Flagsubcommand.FLAG_DATA,
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
