import {
  MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION,
  MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED,
} from "#constants/users/events.js";
import Discord from "discord.js";

import { inspect as _inspect } from "util";

import app from "#app";
import { Events } from "#constants/app/events.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { Collection } from "@discordjs/collection";
import { ComponentType, Message } from "discord.js";

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

export function awaitReactOrMessage({
  target,
  user,
  time,
  reactionOptions = {},
  messageOptions = {},
}) {
  const MAX_TIMEOUT = time ?? 300_000;

  const reactions = reactionOptions.reactions?.filter(Boolean);
  reactions?.forEach((reaction) => target.react(reaction));

  const isUserMessage = (target) => target.id === user.id;
  const isReactOfUser = (react, target) =>
    target.id === user.id &&
    (!reactions.length || reactions.includes(react.emoji.code));
  const filter = (some, adding) =>
    some instanceof Discord.Message
      ? isUserMessage(some.author)
      : isReactOfUser(some, adding);
  const collectorOptions = { max: 1, time: MAX_TIMEOUT, filter };

  return new Promise(async (resolve) => {
    const collected = await Promise.race([
      target.channel.awaitMessages({ ...collectorOptions, ...messageOptions }),
      target.awaitReactions({ ...collectorOptions, ...reactionOptions }),
    ]);

    const some = collected.first();
    if (some instanceof Discord.Message) {
      !messageOptions.preventRemove && some.delete();
    }
    target.reactions.cache.each((reaction) =>
      reaction.users.remove(target.client.user),
    );
    resolve(some);
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
}) {
  const request = await channel.msg(message);
  const response = await awaitReactOrMessage({
    target: request,
    user,
    messageOptions: {
      remove: true,
    },
    reactionOptions: {
      reactions,
    },
    time,
  });
  request.delete();
  const isMessage = response instanceof Message;
  const emoji = response?.emoji;
  return {
    value: response,
    isMessage,
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
