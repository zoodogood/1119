import Discord from "discord.js";

async function awaitUserAccept({ name, message, channel, userData }) {
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

function awaitReactOrMessage({
  target,
  user,
  time,
  reactionOptions = {},
  messageOptions = {},
}) {
  const reactions = reactionOptions.reactions?.filter(Boolean) ?? [];

  const MAX_TIMEOUT = time ?? 900_000;

  const filter = (some, adding) =>
    some instanceof Discord.Message
      ? some.author.id === user.id
      : adding.id === user.id &&
        (!reactions.length ||
          reactions.includes(some.emoji.id ?? some.emoji.name));

  const collectorOptions = { max: 1, time: MAX_TIMEOUT, filter };

  reactions.forEach((reaction) => target.react(reaction));

  return new Promise(async (resolve) => {
    const collected = await Promise.race([
      target.channel.awaitMessages({ ...collectorOptions, ...messageOptions }),
      target.awaitReactions({ ...collectorOptions, ...reactionOptions }),
    ]);

    const some = collected.first();
    if (some instanceof Discord.Message) {
      some.delete();
    }
    target.reactions.cache.each((reaction) =>
      reaction.users.remove(target.client.user),
    );
    resolve(some);
  });
}

export { awaitUserAccept, awaitReactOrMessage };
