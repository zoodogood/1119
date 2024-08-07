import client from "#bot/client.js";
import { Events } from "#constants/app/events.js";
import { createStopPromise } from "#lib/createStopPromise.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import {
  DataManager,
  ErrorsHandler,
  TimeEventsManager,
} from "#lib/modules/mod.js";
import { ActivityType } from "discord.js";

class Event extends BaseEvent {
  options = {
    name: "process/beforeExit",
    once: true,
  };

  constructor() {
    const EVENT = "beforeExit";
    super(EventsManager.emitter, EVENT);
  }

  async run() {
    try {
      client.user?.setActivity("Перезапускаюсь", {
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/monstercat",
      });

      const saveEvent = {
        ...createStopPromise(),
      };
      EventsManager.emitter.emit(Events.RequestSave, saveEvent);
      await saveEvent.whenStopPromises();
      await DataManager.file.write();
      await TimeEventsManager.file.write();
      await ErrorsHandler.sessionWriteFile();
    } catch (error) {
      console.error(error);
    }

    process.exit();
  }
}

export default Event;
