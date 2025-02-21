import EventEmitter from "node:events";

import { SECOND } from "#constants/time.js";
import { assert } from "#src/assert/export.js";
import StorageManager from "#src/data/StorageManager/StorageManager.js";
import { sortByResolve } from "#src/mini.js";
import { multiline, timestampDay, timestampToDate } from "#src/safe-utils.js";
import { rangeToArray } from "@zoodogood/utils/objectives";

export class TimeEventItem<T> {
	_params_as_json?: string;
	createdAt?: number;
	name;
	timestamp;
	get params(): T | null {
		return this._params_as_json ? JSON.parse(this._params_as_json) : null;
	}

	set params(value) {
		if (!value) {
			return;
		}
		this.setParams(value);
	}

	isLost?: boolean;
	setIsLost(isLost: boolean) {
		this.isLost = isLost;
		return this;
	}

	get wasPerformed() {
		return this.isLost !== undefined;
	}

	static from<T>(name: string, timeTo: number, params: T, createdAt?: number) {
		createdAt ||= Date.now();
		return Object.assign(new this(name, createdAt + timeTo), {
			params,
			createdAt,
		});
	}

	static fromJson(json: ReturnType<typeof TimeEventItem.prototype.toJSON>) {
		const { name, timestamp, createdAt, _params_as_json } = json;
		return Object.assign(new this(name, timestamp), {
			createdAt,
			_params_as_json,
		});
	}

	constructor(name: string, timestamp: number) {
		this.name = name;
		this.timestamp = timestamp;
	}

	static fromEventData(eventData: TimeEventItem<unknown>) {
		// @ts-expect-error
		return this.fromJson(eventData);
	}
	toJSON() {
		return {
			name: this.name,
			timestamp: this.timestamp,
			_params_as_json: this._params_as_json,
			createdAt: this.createdAt,
		};
	}

	setCreatedAt(createdAt: any) {
		this.createdAt = createdAt;
		return this;
	}

	setParams(params: T) {
		this._params_as_json = JSON.stringify(params);
		return this;
	}
}

export class TimeEventsManager {
	data = {} as Record<number, TimeEventItem<unknown>[]>;
	emitter = new EventEmitter();
	timeoutId?: NodeJS.Timer;
	file = {
		load: async () => {
			const content = await StorageManager.read("timeEvents.json");
			this.data = JSON.parse(content, (key, value) =>
				value.name ? TimeEventItem.fromJson(value) : value,
			);
		},
		write: async () => {
			const data = JSON.stringify(this.data);
			await StorageManager.write("timeEvents.json", data);
		},
		defaultData: {},
	};

	_nearestEvent: TimeEventItem<unknown> | null = null;

	_pushIntoBuffer(event: TimeEventItem<unknown>) {
		const day = timestampDay(event.timestamp);
		this.data[day] ||= [];
		this.data[day].push(event);
		sortByResolve(this.data[day], ($: { timestamp: any }) => $.timestamp);
		this._prioritizeByLogic(event);
		console.info(`Ивент создан ${event.name}`);
		return event;
	}

	_removeFromBuffer(event: TimeEventItem<unknown>) {
		const [day, index] = this.positionOf(event);
		if (index === null) {
			return false;
		}
		this.data[day!].splice(index, 1);
		if (this.data[day!].length === 0) {
			delete this.data[day!];
		}
		event === this._nearestEvent && this.onActiveNearestEventCancelled();
		return true;
	}

	onEventTimestampChanged(
		event: TimeEventItem<unknown>,
		previous_timestmp: number,
	) {
		this._removeFromBuffer(event);
		this._pushIntoBuffer(event);
		if (event === this._nearestEvent && event.timestamp > previous_timestmp) {
			this.onActiveNearestEventCancelled();
		}
	}

	at(day: number) {
		return this.data[day];
	}

	pushIntoBuffer(eventName: string, ms: number, params: unknown) {
		const event = TimeEventItem.from(eventName, ms, params);
		return this._pushIntoBuffer(event);
	}

	_perform(event: TimeEventItem<unknown>) {
		event.setIsLost(Date.now() - event.timestamp < -SECOND * 10);
		this.emitter.emit("timeEventPerform", event);
		console.info(`Ивент выполнен ${event.name}`);
		return event;
	}

	filterEventsInRange(
		filter: (event: TimeEventItem<unknown>) => unknown,
		range: [number, number],
	) {
		const events = this.getEventsInRange(range);
		return events.filter(filter);
	}

	findBulk(
		targetTimestamps: number[],
		filter: (event: TimeEventItem<unknown>) => unknown,
	) {
		const daysMap: Record<number, number> = {};
		for (const timestamp of targetTimestamps) {
			const day = timestampDay(timestamp);
			daysMap[day] ||= 0;
			daysMap[day]++;
		}

		const events = [];
		for (const day in daysMap) {
			const todayEvents = this.at(+day);
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

	findEventInRange(
		filter: (event: TimeEventItem<unknown>) => unknown,
		range: [number, number],
	) {
		const events = this.getEventsInRange(range);
		return events.find(filter);
	}

	getEventsInRange(range: [number, number]) {
		const events = [];
		for (const day of rangeToArray(range)) {
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
		return (
			// see proof in the file://./readme.md
			(this._nearestEvent && timestampDay(this._nearestEvent.timestamp)) ||
			(() => {
				const days = this.getExistsDaysList();
				if (!days) {
					return null;
				}
				const day = days.reduce((min, day) => Math.min(+min, +day), Infinity);
				return +day;
			})()
		);
	}

	positionOf(event: TimeEventItem<unknown>) {
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

	removeFromBuffer(event: TimeEventItem<unknown>) {
		this._removeFromBuffer(event);
	}

	_prioritizeByLogic(event: TimeEventItem<unknown>) {
		if (this._nearestEvent && event.timestamp >= this._nearestEvent.timestamp) {
			return;
		}
		this._nearestEvent = event;
		this._nearestEvent_schedulePerform();
	}

	_nearestEvent_schedulePerform() {
		const event = this._nearestEvent;
		if (!event) {
			assert(!this.timeoutId);
			return;
		}
		clearTimeout(this.timeoutId);
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

		this.timeoutId = setTimeout(
			this._nearestEvent_onPerformRequest.bind(this),
			Math.max(timeTo, 1),
		);
		return;
	}

	nearestEvent() {
		const day = this.getNearestDay();
		const dayEvents = day ? this.at(day)! : null;
		return dayEvents?.at(0) ?? null;
	}

	_nearestEvent_onPerformRequest() {
		{
			const event = this._nearestEvent;
			assert(event);
			assert(
				event.timestamp - SECOND <= Date.now(),
				`The ${event.name} was executed prematurely; timediff: ${Date.now() - event.timestamp} ms`,
			);
			this._removeFromBuffer(event);
			this._perform(event);
		}
		{
			this._nearestEvent = this.nearestEvent();
			if (!this._nearestEvent) {
				return;
			}
			this._nearestEvent_schedulePerform();
		}
	}

	onActiveNearestEventCancelled() {
		this._nearestEvent = this.nearestEvent();
		if (!this._nearestEvent) {
			return;
		}
		this._nearestEvent_schedulePerform();
	}

	onStartup() {
		this._nearestEvent = this.nearestEvent();
		if (!this._nearestEvent) {
			return;
		}
		this._nearestEvent_schedulePerform();
	}
}
