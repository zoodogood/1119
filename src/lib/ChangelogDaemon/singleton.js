import { Events as AppEvents } from "#constants/app/events.js";
import { ChangelogDaemon } from "#lib/ChangelogDaemon/ChangelogDaemon.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { Events } from "#server/api/extenral/accept_github_webhook.js";

export const singleton = new ChangelogDaemon();

EventsManager.emitter.once(AppEvents.BeforeLogin, async () => {
  await singleton.file.load();
});
EventsManager.emitter.on(AppEvents.RequestSave, () => singleton.file.write());
EventsManager.emitter.on(Events.Commit, (event) => singleton.onPush(event));
