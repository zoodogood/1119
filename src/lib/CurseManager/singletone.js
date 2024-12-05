import { CurseEpochSystem } from "#lib/CurseManager/CurseEpochSystem/CurseEpochSystem.js";
import CurseManager from "#lib/CurseManager/CurseManager.js";
import DataManager from "#lib/DataManager/DataManager.js";
import Executor from "#lib/modules/Executor.js";

Executor.bind("curseManager", (target, { params, interaction }) => {
  if (target === "events") {
    const [event, ...parsed] = params.split(":");
    const base = CurseManager.cursesBase.get(event);
    base.onComponent.call(base, { interaction, params: parsed });

    return;
  }
});

const curseEpochSystem = new CurseEpochSystem(DataManager).setCursesList([
  ...CurseManager.cursesBase.values(),
]);

CurseManager.emitter.on(CurseManager.Events.CurseEnd, (user, curse, context) =>
  curseEpochSystem.onCurseManagerCurseEnd(user, curse, context),
);
