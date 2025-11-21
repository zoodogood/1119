import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'

import { EventEmitter } from '#src/EventEmitter/export.js'

import { Collection } from '@discordjs/collection'
import { glob } from 'glob'

class BaseEvent {
	options = {}

	constructor(target, eventName, options = {}) {
		this.eventTarget = target
		this.eventName = eventName
		this.callback = this.#beforeRun.bind(this)

		this.isListeningNow = false
		this.options = options
	}

	freeze() {
		this.isListeningNow = false

		const callback = this.callback
		const eventName = this.eventName
		const target = this.eventTarget
		target.removeListener(eventName, callback)
	}

	handle() {
		if (this.isListeningNow === true) {
			throw new Error('Listening now')
		}

		const callback = this.callback
		const eventName = this.eventName
		const target = this.eventTarget

		try {
			target.on(eventName, callback)
		} catch (error) {
			throw new Error(`Event ${eventName} with target ${target} haven't "on" method`, {
				cause: error,
			})
		}
		this.isListeningNow = true
	}

	async #beforeRun(...args) {
		this.#logger({ event: this, args })

		if (this.checkCondition?.(...args) === false)
			return

		this.options.once && this.freeze()

		try {
			await this.run(...args)
		} catch (error) {
			ErrorsHandler.onErrorReceive(error, {
				event: this.options.name,
				source: 'Event',
			})
		}
	}

	#logger({ event, args }) {
		console.info(`Event: ${this.eventName}`)
	}
}

class EventsManager {
	static emitter = (new EventEmitter)

	static async importEvents() {
		const events = await Promise.all(
			(await glob('**/*.{listener,time_event}.js', { absolute: true }))
				.map(path => import(path)
					.then(module => (new module.default))
					.catch(error => console.error(`${path}: ${error.message}`)),
			),
		)

		const entries = events.map(event => [event.options.name, event])

		this.collection = new Collection(entries)
		return this
	}

	static listen(name) {
		this.collection.get(name).handle()
	}

	static listenAll() {
		for (const [_name, event] of this.collection) {
			try {
				event.handle?.()
			} catch (error) {
				if (error.message !== 'Listening now') {
					throw error
				}
			}
		}
	}
}

export { BaseEvent, EventsManager }
export default EventsManager
