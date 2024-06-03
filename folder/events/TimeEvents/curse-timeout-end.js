import { client } from "#bot/client.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import { CurseManager } from "#lib/modules/mod.js";

class Event {
  options = {
    name: "TimeEvent/curse-timeout-end",
  };

  run(timeEventData, userId, timestamp) {
    const user = client.users.cache.get(userId);
    if (!user) {
      return;
    }

    const curses = user.data.curses;
    const context = {
      timeEventData,
      timestamp,
      user,
      ...createDefaultPreventable(),
    };
    user.action(ActionsMap.timeEventCurseTimeoutEnd, context);
    if (context.defaultPrevented()) {
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
}

export default Event;
