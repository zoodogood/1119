import { curse_epoch_singleton } from "#lib/CurseManager/CurseEpochSystem/singleton.js";
import CurseManager from "#lib/CurseManager/CurseManager.js";
import Executor from "#lib/modules/Executor.js";

Executor.bind("curseManager", (target, { params, interaction }) => {
	if (target === "events") {
		const [event, ...parsed] = params.split(":");
		const base = CurseManager.cursesBase.get(event);
		base.onComponent.call(base, { interaction, params: parsed });

		return;
	}
});

curse_epoch_singleton.setCursesList([...CurseManager.cursesBase.values()]);

CurseManager.emitter.on(CurseManager.Events.CurseEnd, (user, curse, context) =>
	curse_epoch_singleton.onUserCurseEnd(user, curse, context),
);

export { CurseManager };
