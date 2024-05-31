import config from "#config";
import { Events } from "#constants/app/events.js";
import {
  CounterManager,
  DataManager,
  EventsManager,
  TimeEventsManager,
} from "#lib/modules/mod.js";

class Event {
  static INTERVAL = 60_000 * 5;

  options = {
    name: "TimeEvent/autosave",
  };

  run() {
    if (config.development) {
      return;
    }

    DataManager.file.write();
    TimeEventsManager.file.write();
    CounterManager.file.write();
    EventsManager.emitter.emit(Events.RequestSave);
    return TimeEventsManager.create("autosave", this.constructor.INTERVAL);
  }
}

export default Event;
