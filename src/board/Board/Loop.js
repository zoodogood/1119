import { MINUTE } from "#constants/time.js";
import { Board, BoardFetcher } from "#src/board/Board/Board.js";
import { sleep } from "#src/safe-utils.js";
import { render } from "./render.js";

export class Loop {
	constructor({ interval, items }) {
		this.interval = interval;
		this.items = items;
	}
	async *queue() {
		let i = 0;
		const INTERVAL = 15 * MINUTE;
		const { items } = this;

		while (true) {
			const board = new BoardFetcher().fetch(items[i]);
			i++;
			i %= items.length;
			yield board;
			await sleep(INTERVAL / (items.length + 1));
		}
	}

	async work() {
		for await (const board of this.queue()) {
			if (board instanceof Error) {
				Board.remove(board.message);
			}
			board && render(board);
		}
	}
}
