import { MINUTE } from "#constants/globals/time.js";
import { sleep } from "#lib/safe-utils.js";
import { render } from "./render.js";

export class Loop {
  constructor({ interval, items }) {
    this.interval = interval;
    this.items = items;
  }
  async *queque() {
    let i = 0;
    const INTERVAL = 15 * MINUTE;
    const { items } = this;

    while (true) {
      // board
      yield items[i];

      await sleep(INTERVAL / (items.length + 1));
      i++;
      i %= items.length;
    }
  }

  work() {
    for (const board of this.queque()) {
      render(board);
    }
  }
}
