import config from '#config'
import { StorageManagerConstructor } from '#src/data/StorageManager/StorageManager.js'

const StorageManager = new StorageManagerConstructor
await StorageManager.setDriver( config.database.driver )

export default StorageManager
