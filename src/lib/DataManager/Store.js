import EventEmitter from "node:events";
// Очень примитивная универсальная реализация для управления состояниями из разных потоков,
// изменения можно слушать через observable.subscribe

export class Store {
  cache = new Map();
  /**
   *
   * @param {{} & {id: string}} cell
   * @param {string} property
   * @returns {ObservableState}
   */

  setup(cell, property) {
    const { id } = cell;
    const key = `${id}_${property}`;
    const { cache } = this;

    const wire =
      (cache.has(key) && cache.get(key).deref()) ||
      (() => {
        const wire = new ObservableState(cell[property]);
        cache.set(key, new WeakRef(wire));
        return wire;
      })();

    return wire;
  }
}

class ObservableState extends EventEmitter {
  constructor(item) {
    super();
    this.value = item;
    this.cachedAt = Date.now();
  }
  notify() {
    this.emit("value");
  }

  subscribe(callback) {
    return this.disposable("value", callback);
  }
}
