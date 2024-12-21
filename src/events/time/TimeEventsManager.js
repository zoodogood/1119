import EventEmitter from "node:events";

import { SECOND } from "#constants/time.js";
import { assert } from "#src/assert/export.js";
import StorageManager from "#src/data/StorageManager/StorageManager.js";
import { sortByResolve } from "#src/mini.js";
import { multiline, timestampDay, timestampToDate } from "#src/safe-utils.js";
import { rangeToArray } from "@zoodogood/utils/objectives";

export class TimeEventData {
	_params_as_json;
	createdAt;
	isLost;
	name;
	timestamp;
	get params() {
		return this._params_as_json ? JSON.parse(this._params_as_json) : null;
	}

	set params(value) {
		this.setParams(value);
	}

	constructor(name, timeTo, params) {
		const createdAt = Date.now();
		this.name = name;
		this.timestamp = createdAt + timeTo;
		this.createdAt = createdAt;
		this.params = params;
	}

	static from(name, timestamp, _params_as_json, createdAt) {
		const data = new this();
		data.name = name;
		data.timestamp = timestamp;
		data.createdAt = createdAt;
		data._params_as_json = _params_as_json;
		return data;
	}

	static fromEventData(eventData) {
		return this.from(
			eventData.name,
			eventData.timestamp,
			eventData._params_as_json,
			eventData.createdAt,
		);
	}

	setCreatedAt(createdAt) {
		this.createdAt = createdAt;
		return this;
	}

	setIsLost(isLost) {
		this.isLost = isLost;
		return this;
	}

	setParams(params) {
		if (!params) {
			return;
		}
		this._params_as_json = JSON.stringify(params);
		return this;
	}
}
export class TimeEventsManager {
	data = {};
	emitter = new EventEmitter();
	file = {
		load: async () => {
			const content = await StorageManager.read("timeEvents.json");
			const events = JSON.parse(content, (key, value) =>
				value.name ? TimeEventData.fromEventData(value) : value,
			);
			this.data = events;
		},
		write: async () => {
			const data = JSON.stringify(this.data);
			await StorageManager.write("timeEvents.json", data);
		},
		defaultData: {},
	};

	#lastSeenDay;

	_pushIntoQueue(event) {
		const day = timestampDay(event.timestamp);

		this.data[day] ||= [];
		this.data[day].push(event);
		sortByResolve(this.data[day], ($) => $.timestamp);

		const needUpdate = day <= this.#lastSeenDay || !this.#lastSeenDay;

		if (needUpdate) {
			day < this.#lastSeenDay && (this.#lastSeenDay = null);
			this.runTimeout();
		}

		console.info(`Ивент создан ${event.name}`);
		return event;
	}

	_removeFromQueue(event) {
		const [day, index] = this.positionOf(event);
		if (index === null) {
			return false;
		}
		this.data[day].splice(index, 1);
		if (this.data[day].length === 0) {
			delete this.data[day];
		}
		return true;
	}

	at(day) {
		return this.data[day];
	}

	pushIntoQueue(eventName, ms, params) {
		const event = new TimeEventData(eventName, ms, params);
		return this._pushIntoQueue(event);
	}

	execute(event) {
		this._removeFromQueue(event);

		event.setIsLost(Date.now() - event.timestamp < -SECOND * 10);
		this.emitter.emit("timeEvent", event);
		console.info(`Ивент выполнен ${event.name}`);
		return;
	}

	fetchNextEvent() {
		const dayEvents = this.getDistancePrefferedDayEvents();
		return dayEvents?.at(0) ?? null;
	}

	filterEventsInRange(filter, range) {
		const events = this.getEventsInRange(range);
		return events.filter(filter);
	}

	findBulk(targetTimestamps, filter) {
		const daysMap = {};
		for (const timestamp of targetTimestamps) {
			const day = timestampDay(timestamp);
			daysMap[day] ||= 0;
			daysMap[day]++;
		}

		const events = [];
		for (const day in daysMap) {
			const todayEvents = this.at(day);
			const count = daysMap[day];
			if (!todayEvents) {
				events.push(...new Array(count).fill(null));
				continue;
			}

			let counter = 0;
			for (const event of todayEvents) {
				if (!targetTimestamps.includes(event.timestamp) || !filter(event)) {
					continue;
				}
				counter++;
				events.push(event);
				if (counter === count) {
					break;
				}
			}

			if (counter < count) {
				events.push(...new Array(count - counter).fill(null));
			}
		}
		return events;
	}

	findEventInRange(filter, range) {
		const events = this.getEventsInRange(range);
		return events.find(filter);
	}

	getDistancePrefferedDayEvents(needCache = true) {
		const day = this.#lastSeenDay || this.getNearestDay();

		needCache && (this.#lastSeenDay = day);

		const dayEvents = this.at(day);
		if (!dayEvents) {
			return null;
		}

		// Day without events is not preffered
		if (!dayEvents.length) {
			this.#lastSeenDay = null;
			return this.getDistancePrefferedDayEvents();
		}
		return dayEvents;
	}

	getEventsInRange(range) {
		const days = [...rangeToArray(range)];
		const events = [];
		for (const day of days) {
			const todayEvents = this.at(day);
			todayEvents && events.push(...todayEvents);
		}

		return events;
	}

	getExistsDaysList() {
		const days = Object.keys(this.data);
		if (days.length === 0) {
			return null;
		}
		return days;
	}

	getNearestDay() {
		const days = this.getExistsDaysList();
		if (!days) {
			return null;
		}
		const day = days.reduce((min, day) => Math.min(min, day));
		return +day;
	}

	onTimeout() {
		const event = this.fetchNextEvent();
		if (!event) {
			return;
		}
		if (event.timestamp > Date.now()) {
			return this.runTimeout();
		}

		this.execute(event);
		this.runTimeout();
	}

	positionOf(event) {
		const day = timestampDay(event.timestamp);
		if (!this.data[day]) {
			return [null, null];
		}
		const index = this.data[day].indexOf(event);
		if (index === -1) {
			return [day, null];
		}
		return [day, index];
	}

	removeFromQueue(event) {
		this._removeFromQueue(event);
		this.data[day].splice(index, 1);
		this.runTimeout();
		return true;
	}

	runTimeout() {
		const event = this.fetchNextEvent();
		if (!event) {
			this.#lastSeenDay = null;
			assert(!this.timeout);
			return;
		}
		clearTimeout(this.timeout);
		const timeTo = event.timestamp - Date.now();
		if (timeTo > SECOND * 10) {
			const parse = new Intl.DateTimeFormat("ru-ru", {
				weekday: "short",
				hour: "2-digit",
				minute: "2-digit",
			}).format();
			console.info(
				multiline([
					"{\n\n",
					`  Имя события: ${event.name},\n`,
					`  Текущее время: ${parse},\n`,
					`  Времени до начала: ${timestampToDate(timeTo)}`,
					`\n\n}`,
				]),
			);
		}

		this.timeout = setTimeout(this.onTimeout.bind(this), Math.max(timeTo, 1));
		return;
	}
}