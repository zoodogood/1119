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

  hold_wire(cell, property) {
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

class ObservableState {
  #throttle_timer = null;
  request_throttle = 200;
  subscribers_list = [];
  constructor(item) {
    this.value = item;
    this.cachedAt = Date.now();
  }
  publish() {
    if (this.#throttle_timer) {
      clearTimeout(this.#throttle_timer);
    }
    this.#throttle_timer = setTimeout(() => {
      // main action
      this.subscribers_list.forEach((callback) => callback());
    }, this.request_throttle);
  }

  subscribe(callback) {
    this.subscribers_list.push(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    const index = this.subscribers_list.indexOf(callback);
    index !== -1 && this.subscribers_list.splice(index, 1);
  }
}
