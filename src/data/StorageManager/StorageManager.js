export class StorageManagerConstructor {
	async keys( path ) {
		return await this.driver.keys( path )
	}

	async read( name ) {
		return await this.driver.readFile( name )
	}

	async readOrDefault( name , defaultValue ) {
		return await this.driver.readFile( name ) || ( await this.driver.writeFile( name , defaultValue ) , await this.driver.readFile( name ) )
	}

	async setDriver( driverId ) {
		const module = await ( () => {
			switch ( driverId ) {
			case 'localdb':
				return import( '#src/data/StorageManager/drivers/FileDBDriver.js' )

			case 'mongodb':
				return import( '#src/data/StorageManager/drivers/MongoDBDriver.js' )

			default:
				throw new Error(
					'Maybe. Storage manager driver not selected in config file at database.driver; Incorrect driverId' ,
				)
			}
		} )()

		this.driver = ( new module.default )

		await this.driver.init()
	}

	async write( name , content ) {
		return await this.driver.writeFile( name , content )
	}
}

