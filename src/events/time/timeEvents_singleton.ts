import { omit } from "@zoodogood/utils/objectives";
import { TimeEventItem, TimeEventsManager } from "./TimeEventsManager.js";

export function mutate_time_event<T>(
	event: TimeEventItem<T>,
	assign: Partial<TimeEventItem<T>>,
) {
	const { timestamp: previous_timestmp } = event;
	Object.assign(
		event,
		omit(assign, (key: string) =>
			["name", "timestamp", "params", "createdAt"].includes(key),
		),
	);
	const is_timestamp_changed = assign.timestamp !== previous_timestmp;
	if (is_timestamp_changed) {
		timeEvents_singleton.onEventTimestampChanged(event, previous_timestmp);
	}
	return event;
}

const timeEvents_singleton = new TimeEventsManager();
await timeEvents_singleton.file.load();
export { timeEvents_singleton };
