import { omit } from "@zoodogood/utils/objectives";
import { TimeEventsManager } from "./TimeEventsManager.js";

export function mutate_time_event(event, assign) {
	const is_timestamp_changed = assign.timestamp !== event.timestamp;
	if (is_timestamp_changed) {
		timeEvents_singleton._removeFromQueue(event);
	}

	Object.assign(
		event,
		omit(assign, (key) =>
			["name", "timestamp", "params", "createdAt"].includes(key),
		),
	);

	if (is_timestamp_changed) {
		timeEvents_singleton._pushIntoQueue(event);
	}
	return event;
}

const timeEvents_singleton = new TimeEventsManager();
await timeEvents_singleton.file.load();
export { timeEvents_singleton };
