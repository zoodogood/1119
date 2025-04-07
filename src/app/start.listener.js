import { Events } from '#src/app/events.enum.js'

import BossManager from '#src/boss/BossManager.js'
import client from '#src/bot/client/singleton.js'
import { createStopPromise } from '#src/createStopPromise.js'
import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'
import UserEffectManager from '#src/user/actions/EffectsManager.js'

class Event extends BaseEvent {
	options = {
		name: 'core/start' ,
	}

	constructor() {
		const EVENT = Events.Start
		super( EventsManager.emitter , EVENT )
	}

	async clientLogin() {
		const event = {
			... createStopPromise() ,
		}
		EventsManager.emitter.emit( Events.BeforeLogin , event )
		await event.whenStopPromises()
		client.login( process.env.DISCORD_TOKEN )
	}

	async run() {
		EventsManager.listenAll()
		await ErrorsHandler.importFileErrorsList()
		await UserEffectManager.importEffects()
		BossManager.BossEffects.updateBasesFromManager()

		this.clientLogin()
	}
}

export default Event
