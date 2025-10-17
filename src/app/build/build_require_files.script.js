import { execSync } from 'node:child_process'
import FileSystem from 'node:fs/promises'
import Path from 'node:path'
import { isWindowsBased } from '#src/nodejs/process/isWindowsBased.js'

const resolve = path => Path.resolve( process.cwd() , path )

async function FileExists( path ) {
	return !!( await FileSystem.stat( resolve( path ) ).catch( () => null ) )
}

// to-do рефакторинг: отказаться от завязки на прописанных здесь путях и через glob искать нечто вроде meta.checkFiles.json
const Paths = {
	env: '.env' ,
	envExample: 'folder/development/.env.example' ,
	config: 'src/config.json.js' ,
	configExample: 'folder/development/config.json.js.example' ,

	firstBuildDocs: 'src/public/special/first-build.html' ,
}

!( await FileExists( Paths.env ) )
&& ( await ( async () => {
	const command = isWindowsBased() ? `start ""` : 'open'

	execSync( `${ command } "file://${ resolve( Paths.firstBuildDocs ) }"` )
	const source = resolve( Paths.envExample )
	const target = resolve( Paths.env )
	await FileSystem.copyFile( source , target )
	console.info( `CREATED: ${ Paths.env }` )
} )() )

!( await FileExists( Paths.config ) )
&& ( await ( async () => {
	const source = resolve( Paths.configExample )
	const target = resolve( Paths.config )
	await FileSystem.copyFile( source , target )
	console.info( `CREATED: ${ Paths.config }` )
} )() )

console.info( 'Next.\n' )
