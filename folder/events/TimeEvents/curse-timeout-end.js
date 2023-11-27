import { client } from "#bot/client.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { CurseManager } from "#lib/modules/mod.js";

class Event {
  run(isLost, userId, timestamp) {
    const user = client.users.cache.get(userId);
    if (!user) {
      return;
    }

    const curses = user.data.curses;
    const event = new globalThis.Event("timeEventCurseTimeoutEnd", {
      cancelable: true,
    });
    user.action(ActionsMap.timeEventCurseTimeoutEnd, {
      isLost,
      timestamp,
      event,
    });
    if (event.defaultPrevented) {
      return;
    }
    if (!curses) {
      return;
    }

    const compare = (curse) => curse.timestamp === timestamp;
    const curse = curses.find(compare);

    if (!curse) {
      return;
    }

    CurseManager.checkAvailable({ user, curse });
  }

  options = {
    name: "TimeEvent/curse-timeout-end",
  };
}

export default Event;
