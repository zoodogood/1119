import app from "#app";
import config from "#config";
import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "uncaughtException";
    super(process, EVENT);
  }

  async run(error) {
    ErrorsHandler.onErrorReceive(error, {
      uncaughtException: true,
      emitExit: true,
    });
    try {
      const channel = app.client.channels.cache.get(config.guild.logChannelId);
      await channel?.msg({
        content: "Бот был перезапущен после необработанной ошибки",
        description: `message: ${error.message}\n, ${Date.now()}`,
      });
    } catch (error) {
      console.error(error);
    }
    EventsManager.emitter.emit("beforeExit");
  }

  options = {
    name: "process/uncaughtException",
  };
}

export default Event;
