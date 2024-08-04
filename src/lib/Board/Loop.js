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

    while (true) {
      const counter = this.data[i];
      yield counter;

      await sleep(INTERVAL / (this.data.length + 1));
      i++;
      i %= this.data.length;
    }
  }

  work() {
    for (const counter of this.queque()) {
      render(counter);
    }
  }
}
