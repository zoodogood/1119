import { Events as AppEvents } from "#constants/app/events.js";
import { ChangelogDaemon } from "#lib/ChangelogDaemon/ChangelogDaemon.js";
import { ChannelPatchLogWriter } from "#lib/ChangelogDaemon/ChannelChangelogWriter.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { Events } from "#server/api/extenral/accept_github_webhook.js";

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
EventsManager.emitter.on(AppEvents.RequestSave, () => singleton.file.write());
EventsManager.emitter.on(Events.Commit, (event) => singleton.onPush(event));

// MARK: Write to channel
new ChannelPatchLogWriter(singleton).listen();
