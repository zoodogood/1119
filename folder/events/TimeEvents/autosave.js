import config from "#config";
import { Events } from "#constants/app/events.js";
import { createStopPromise } from "#lib/createStopPromise.js";
import {
  DataManager,
  EventsManager,
  TimeEventsManager,
} from "#lib/modules/mod.js";

class Event {
  static INTERVAL = 60_000 * 5;

  options = {
    name: "TimeEvent/autosave",
  };

  async run() {
    if (config.development) {
      return;
    }
    DataManager.file.write();
    TimeEventsManager.file.write();
    const saveEvent = {
      ...createStopPromise(),
    };
    EventsManager.emitter.emit(Events.RequestSave, saveEvent);
    await saveEvent.whenStopPromises();
    return TimeEventsManager.create("autosave", this.constructor.INTERVAL);
  }
}

export default Event;
