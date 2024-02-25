import {
  MESSAGES_SPAM_FILTER_ALLOWED_IN_SUCCESSION,
  MESSAGES_SPAM_FILTER_TARGET_WHEN_PASSED,
} from "#constants/users/events.js";
import Discord from "discord.js";

import { Collection } from "@discordjs/collection";
import { BaseChannel } from "discord.js";
import app from "#app";

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
    (!reactions.length ||
      reactions.includes(react.emoji.id ?? react.emoji.name));
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
  const isMessage = response instanceof BaseChannel;
  const emoji = response?.emoji;
  return {
    value: response,
    isMessage,
    content: response?.content,
    emoji: emoji?.id || emoji?.identifier,
  };
}

export function whenClientIsReady() {
  const { client } = app;

  if (client.readyAt) {
    return true;
  }

  return new Promise((resolve) => client.once("ready", resolve));
}
