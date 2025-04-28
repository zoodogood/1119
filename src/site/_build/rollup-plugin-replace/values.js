import FileSystem from 'node:fs/promises'
import Path from 'node:path'
import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'
import { readPackageJson } from '#src/nodejs/readPackageJson.js'
import { yaml } from '#src/safe-utils.js'
import { glob } from 'glob'

const packageJSON = await readPackageJson()
const bot
	= ( await fetchFromInnerApi( './client/user' ).catch( () => null ) ) ?? null

const i18n = await new Promise( async ( resolve ) => {
	const files = await glob( '**/i18n/*.yaml' , { absolute: true } )

	const locales = {}

	for ( const filePath of files ) {
		const content = await FileSystem.readFile( filePath )
		const name = Path.basename( filePath , '.yaml' )
		locales[ name ] = yaml.parse( String( content ) )
	}

	resolve( locales )
} )

const data = {
	bot: new Object( bot ).id ? bot : null ,
	version: packageJSON.version ,
	buildedTimestamp: Date.now() ,
	cwd: process.cwd() ,
	i18n ,
}
export default {
	__json__: JSON.stringify( data ) ,
}
