import { Events as AppEvents } from "#src/app/events.enum.js";
import EventsManager from "#src/events/EventsManager.js";
import { Events } from "#src/github/accept_webhook.rest.js";
import { ChangelogDaemon } from "./ChangelogDaemon.js";
import { ChannelPatchLogWriter } from "./ChannelChangelogWriter.js";

export const singleton = new ChangelogDaemon();

EventsManager.emitter.once(AppEvents.BeforeLogin, async () => {
	await singleton.file.load();
	// to-do: developer crutch
	for (const change of singleton.data) {
		if (change.uid) {
			continue;
		}
		const { createdAt } = change;
		change.uid = `${createdAt}_${Math.floor(Math.random() * createdAt)}`;
	}
});
EventsManager.emitter.on(AppEvents.RequestSave, async (event) => {
	const { resolve } = event.addStopPromise();
	await singleton.file.write();
	resolve();
});
EventsManager.emitter.on(Events.Commit, (event) => singleton.onPush(event));

// MARK: Write to channel
new ChannelPatchLogWriter(singleton).listen();
