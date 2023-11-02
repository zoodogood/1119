import {
  TimeEventsManager,
  DataManager,
  CounterManager,
} from "#lib/modules/mod.js";

class Event {
  static INTERVAL = 60_000 * 5;

  run() {
    DataManager.file.write();
    TimeEventsManager.file.write();
    CounterManager.file.write();
    return TimeEventsManager.create("autosave", this.constructor.INTERVAL);
  }

  options = {
    name: "TimeEvent/autosave",
  };
}

export default Event;
