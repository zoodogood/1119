import EventsEmitter from "events";

class Executor {
  static #constructors = {};

  static emitter = new EventsEmitter();

  static bind(key, callback) {
    this.#constructors[key] = callback;
  }

  static emit(key, target, parameters) {
    const callback = this.#constructors[key];
    return callback.call(null, target, parameters);
  }

  static parseCustomId(customId) {
    // input example: @command/snippet/example:1:2
    const [_full, key, target, parameters] =
      customId.match(/^@(.+?)\/(.+?)\/(.+?)$/) ?? [];
    if (!key) {
      return null;
    }

    return [key, target, parameters];
  }
}

export { Executor };
export default Executor;
