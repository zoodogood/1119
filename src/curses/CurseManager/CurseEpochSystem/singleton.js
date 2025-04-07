import { cursesBase } from '#src/curses/CurseManager/curses/curses.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'
import { DataManager } from '#src/data/singleton.js'
import { CurseEpochSystem } from './CurseEpochSystem.js'

await DataManager.require_load()
const curseEpochSystem = new CurseEpochSystem( DataManager )

curseEpochSystem.setCursesList( [ ... cursesBase.values() ] )

CurseManager.emitter.on( CurseManager.Events.CurseEnd , ( user , curse , context ) =>
	curseEpochSystem.onUserCurseEnd( user , curse , context ) )

export { curseEpochSystem as curse_epoch_singleton }
