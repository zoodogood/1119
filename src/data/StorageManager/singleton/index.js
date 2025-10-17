import { StorageManagerConstructor } from "#src/data/StorageManager/StorageManager.js"
import config  from "#config"

const StorageManager = new StorageManagerConstructor
await StorageManager.setDriver( config.database.driver )

export default StorageManager
