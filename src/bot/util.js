import {
  MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION,
  MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED,
} from "#constants/users/events.js";

import { inspect as _inspect } from "util";

import app from "#app";
import { Events } from "#constants/app/events.js";
import { MINUTE } from "#constants/globals/time.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { Collection } from "@discordjs/collection";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import {
  ComponentType,
  Message,
  MessageComponentInteraction,
  MessageReaction,
} from "discord.js";

export async function awaitUserAccept({ name, message, channel, userData }) {
  const prefix = "userAccept_";
  if (`${prefix}${name}` in userData) {
    return true;
  }
  const context = {};
  context.message = await channel.msg(message);
  const react = await context.message.awaitReact(
    { user: userData, removeType: "all" },
    "685057435161198594",
    "763807890573885456",
  );
  await context.message.delete();

  if (react === "685057435161198594") {
    userData[`${prefix}${name}`] = 1;
    return true;
  }
  return false;
}

export function chunkBySize(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size),
  );
}

export function awaitInteractOrMessage({
  target,
  user,
  time,
  filter = null,
  reactionOptions = {},
  messageOptions = {},
  componentOptions = {},
}) {
  const MAX_TIMEOUT = time ?? MINUTE * 5;
  const user_checker = (candidate) =>
    (!user && !candidate.bot) || candidate === user;

  const reactions = reactionOptions.reactions?.filter(Boolean);
  reactions?.forEach((reaction) => target.react(reaction));

  const isUserMessage = (message) =>
    message instanceof Message && user_checker(message.author);
  const isReactOfUser = (react, user_was_reacted) =>
    react instanceof MessageReaction &&
    user_checker(user_was_reacted) &&
    (!reactions.length || reactions.includes(react.emoji.code));
  const isComponentOfUser = (interaction) =>
    interaction instanceof MessageComponentInteraction &&
    (user_checker(interaction.user) ||
      (() => {
        interaction.msg({
          ephemeral: true,
          description: `Это взаимодействие доступно только ${user}`,
          color: "#ff0000",
        });
      })());

  const pass_interaction = (...params) =>
    [isUserMessage, isReactOfUser, isComponentOfUser].some((callback) =>
      callback(...params),
    ) &&
    (!filter || !filter(...params));

  const collectorOptions = {
    max: 1,
    time: MAX_TIMEOUT,
    filter: pass_interaction,
  };

  return new Promise(async (resolve) => {
    const collected = await Promise.race(
      [
        !messageOptions.disable &&
          target.channel.awaitMessages({
            ...collectorOptions,
            ...messageOptions,
          }),
        reactionOptions.reactions &&
          target.awaitReactions({ ...collectorOptions, ...reactionOptions }),
        componentOptions.listen &&
          target.awaitMessageComponent({
            ...collectorOptions,
            ...componentOptions,
          }),
      ].filter(Boolean),
    );

    const answer = collected.first?.() || collected;
    if (answer instanceof Message) {
      !messageOptions.preventRemove && answer.delete();
    }
    if (answer instanceof MessageReaction) {
      !reactionOptions.preventRemove && answer.remove(user);
    }
    resolve(answer);
  });
}

export function overTheMessageSpamLimit(user) {
  return (
    Date.now() +
      MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION *
        MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED >
    user.CD_msg
  );
}

/**
 *
 * @param {Array<T>} array
 * @returns {Collection<string, T>}
 */
export function transformToCollectionUsingKey(array) {
  const entries = array.map((object) => [object.key, object]);
  return new Collection(entries);
}

export async function question({
  channel,
  user,
  message,
  time = null,
  reactions = [],
  messageOptions = {},
  listen_components = false,
  validation = null,
  validation_hint = null,
  filter = null,
}) {
  const response = await (async () => {
    while (true) {
      const request = await channel.msg(message);
      const response = await awaitInteractOrMessage({
        target: request,
        user,
        filter,
        messageOptions: {
          remove: true,
          ...messageOptions,
        },
        reactionOptions: {
          reactions,
        },
        componentOptions: {
          listen: listen_components,
        },
        time,
      });
      request.delete();
      if (!response) {
        return response;
      }

      if (!validation || (await validation(response))) {
        return response;
      }
      const { isComponent } = await question({
        channel: request.channel,
        message: {
          title: "Прикажите повторить операцию или завершить?",
          user,
          description: `${response instanceof Message ? `Ваш ответ:\n>>> \`\`\`\n${response.content}\n\`\`\`\n` : ""}Подсказка взодных данных: ${validation_hint}\n\n-# JavaScript код проверки входных данных\n\`\`\`js\n${validation}\n\`\`\``,
          footer: {
            text: "Контекст автоматически сбросится через минуту",
            iconURL: user?.avatarURL(),
          },
          components: justButtonComponents({
            label: "Продолжить с этого места",
          }),
        },
        messageOptions: {
          disable: true,
        },
        listen_components: true,
        time: MINUTE,
      });

      if (!isComponent) {
        return null;
      }
    }
  })();

  const emoji = response?.emoji;

  return {
    value: response,
    isMessage: response instanceof Message,
    isComponent: response instanceof MessageComponentInteraction,
    content: response?.content,
    emoji: emoji?.id || emoji?.identifier,
  };
}

export async function whenClientIsReady() {
  // state 1: client not initialized
  // state 2: client initialized
  // state 3: client ready
  if (!app.client) {
    await new Promise((resolve) =>
      EventsManager.emitter.once(Events.Ready, resolve),
    );
  }
  const { client } = app;

  if (client.readyAt) {
    return true;
  }

  return await new Promise((resolve) => client.once("ready", resolve));
}

export async function inspect(value) {
  const inspected = _inspect(value, {
    maxArrayLength: 10,
    maxStringLength: 50,
    numericSeparator: true,
    getters: true,
  }).replace(app.client.token, "");
  const proto = Object.getOwnPropertyNames(value)
    .filter((name) => name !== "constructor")
    .map((name) => `${name}`)
    .join("\n");
  return `${inspected}\n[ownPropertyNames ${value.name}]\n${proto}`;
}

export function use_unique_characters_marker(value, label, flags = "") {
  const START = "_µ§§";
  const MIDDLE = "^";
  const END = "µ§§;";

  return {
    value: `${START}${label}${MIDDLE}${value}${END}`,
    regex: new RegExp(`${START}${label}\\${MIDDLE}((?:.|\\n)*?)${END}`, flags),
  };
}

export function justSelectMenuComponent({ placeholder, labels, addable = {} }) {
  return {
    type: ComponentType.StringSelect,
    placeholder,
    options: labels.map((label, index) => ({ label, value: String(index) })),
    ...addable,
  };
}
