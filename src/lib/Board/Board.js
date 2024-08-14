import client from "#bot/client.js";

function board_parse_id(id) {
  const [channelId, indexId] = id?.split("_") || [];
  const channel = client.channels.cache.get(channelId);
  return { channel, indexId };
}

export class Board {
  constructor({ i, cid, uid, key }) {
    this.i = i;
    this.cid = cid;
    this.uid = uid;
    this.key = key;
  }

  static fetch(id) {
    return new BoardFetcher().fetch(id);
  }

  static remove(singletone, id) {
    return;
    return new BoardRemover().remove(singletone, id);
  }
}

export class BoardFactory {
  init(context) {
    const { guild, channel, user, boardBase } = context;
    const boards = (guild.data.boards ||= []);
    const index = (Math.max(...boards.map(({ i }) => i)) || 0) + 1;

    const board = new Board({
      i: index,
      cid: channel.id,
      uid: user.id,
      key: boardBase.key,
    });
    return board;
  }
}

export class BoardFetcher {
  fetch(id) {
    const { channel, indexId } = board_parse_id(id);
    const channelId = channel?.id;

    if (!channel) {
      return new Error();
    }

    const { guild } = channel;
    const board = guild.data.boards.find(
      ({ i, cid }) => i === indexId && cid === channelId,
    );
    if (!board) {
      return new Error();
    }
  }
}

export class BoardRemover {
  remove(singletone, id) {
    singletone.loop.items.remove(id);
    const board = new BoardFetcher().fetch(id);
    const { channel } = board_parse_id(id);
    const { guild } = channel;
    guild.data.board.remove(board);
  }
}
