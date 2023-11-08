import { Collection } from "@discordjs/collection";

import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import EventsEmitter from "events";

import { ImportDirectory } from "@zoodogood/import-directory";

const PATH = "./folder/events";

class BaseEvent {
  constructor(target, eventName, options = {}) {
    this.eventTarget = target;
    this.eventName = eventName;
    this.callback = this.#beforeRun.bind(this);

    this.isListeningNow = false;
    this.options = options;
  }

  handle() {
    if (this.isListeningNow === true) {
      throw new Error("Listening now");
    }

    const callback = this.callback;
    const eventName = this.eventName;
    const target = this.eventTarget;

    target.on(eventName, callback);
    this.isListeningNow = true;
  }

  freeze() {
    this.isListeningNow = false;

    const callback = this.callback;
    const eventName = this.eventName;
    const target = this.eventTarget;
    target.removeListener(eventName, callback);
  }

  #logger({ event, args }) {
    console.info(`Event: ${this.eventName}`);
  }
  async #beforeRun(...args) {
    this.#logger({ event: this, args });

    if (this.checkCondition?.(...args) === false) return;

    this.options.once && this.freeze();

    try {
      await this.run(...args);
    } catch (error) {
      ErrorsHandler.Audit.push(error, {
        event: this.options.name,
        source: "Event",
      });
    }
  }

  options = {};
}

class EventsManager {
  static emitter = new EventsEmitter();

  static async importEvents() {
    const options = { subfolders: true };
    const events = (await new ImportDirectory(options).import(PATH)).map(
      ({ default: Event }) => new Event(),
    );

    const entries = events.map((event) => [event.options.name, event]);

    this.collection = new Collection(entries);
    return this;
  }

  static listen(name) {
    this.collection.get(name).handle();
  }

  static listenAll() {
    for (const [_name, event] of this.collection) {
      try {
        event.handle?.();
      } catch (error) {
        if (error.message !== "Listening now") {
          throw error;
        }
      }
    }
  }
}

export { EventsManager, BaseEvent };
export default EventsManager;
