import { CurseEpochSystem } from "#lib/CurseManager/CurseEpochSystem/CurseEpochSystem.js";
import { DataManager } from "#lib/DataManager/singletone.js";

await DataManager.require_load();
const curseEpochSystem = new CurseEpochSystem(DataManager);

export { curseEpochSystem as curse_epoch_singletone };
