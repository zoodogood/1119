import {
	TimeEventItem,
	TimeEventsManager,
} from "#root/src/events/time/TimeEventsManager.js";
import { expect, test } from "vitest";

test("TimeEventsManager.nearestToBeFirst", async () => {
	const timeEvents = new TimeEventsManager();
	timeEvents.data = {};
	timeEvents.pushIntoBuffer("toBeFirst", 15, {});
	timeEvents.pushIntoBuffer("toBeSecond", 30, {});
	const event = await new Promise<TimeEventItem<unknown>>((resolve) =>
		timeEvents.emitter.once("timeEventPerform", resolve),
	);
	expect(event.name === "toBeFirst").toBe(true);
});

test("TimeEventsManager.nearestToBeFirst.reversed", async () => {
	const timeEvents = new TimeEventsManager();
	timeEvents.data = {};
	timeEvents.pushIntoBuffer("toBeSecond", 30, {});
	timeEvents.pushIntoBuffer("toBeFirst", 15, {});
	const event = await new Promise<TimeEventItem<unknown>>((resolve) =>
		timeEvents.emitter.once("timeEventPerform", resolve),
	);
	expect(event.name === "toBeFirst").toBe(true);
});

test("TimeEventsManager.nearestOrder", async () => {
	const timeEvents = new TimeEventsManager();
	timeEvents.data = {};
	timeEvents.pushIntoBuffer("toBeThird", 70, {});
	timeEvents.pushIntoBuffer("toBeSecond", 30, {});
	timeEvents.pushIntoBuffer("toBeFirst", 15, {});
	timeEvents.flat();
	const event = await new Promise<TimeEventItem<unknown>>((resolve) =>
		timeEvents.emitter.once("timeEventPerform", resolve),
	);
	expect(event.name).toBe("toBeFirst");
	expect(timeEvents._nearestEvent!.name).toBe("toBeSecond");
});

test("TimeEventsManager.nearestOrder2", async () => {
	const timeEvents = new TimeEventsManager();
	timeEvents.data = {
		[1]: [
			TimeEventItem.from("toBeFirst", 15, {}),
			TimeEventItem.from("toBeSecond", 30, {}),
			TimeEventItem.from("toBeThird", 70, {}),
		],
	};
	const nearestEvent = timeEvents.nearestEvent();
	expect(nearestEvent!.name).toBe("toBeFirst");
});
