import { Events as AppEvents } from "#constants/app/events.js";
import { MINUTE } from "#constants/globals/time.js";

import EventsManager from "#lib/modules/EventsManager.js";
import { TemplateRender } from "./TemplateRender.js";

export const singleton = new TemplateRender({ interval: 15 * MINUTE });

EventsManager.emitter.once(AppEvents.Ready, async () => {
  // to-do: developer crutch
  return;
  await singleton.file.load();
  singleton.loop.work();
});
EventsManager.emitter.on(AppEvents.RequestSave, async (event) => {
  // to-do: developer crutch
  return;
  const { resolve } = event.addStopPromise();
  await singleton.file.write();
  resolve();
});
