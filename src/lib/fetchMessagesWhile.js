export async function* fetchMessagesWhile({
  fromMessage = null,
  while: checkWhile = null,
  direction = "before",
  channel,
}) {
  const { messages } = channel;
  const MAX_AVAILABLE_LIMIT = 50;
  let bulk;
  do {
    bulk = await messages.fetch({
      limit: MAX_AVAILABLE_LIMIT,
      [direction]: fromMessage,
    });
    for (const message of bulk.values()) {
      yield message;
    }
    if (checkWhile && !checkWhile()) {
      return;
    }
    fromMessage = bulk.at(-1)?.id;
  } while (bulk.length === MAX_AVAILABLE_LIMIT);
}
