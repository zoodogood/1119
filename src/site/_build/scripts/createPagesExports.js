/**
 * Input: none
 * Output behavior: build a working exports[builded].js file with list of pages
 */

import FileSystem from 'node:fs/promises'
import Path from 'node:path'
import { cwd_path } from '#src/nodejs/path_relative_to_root.js'
import { glob } from 'glob'

const targetFiles = await Promise.all(
	( await glob( '**/*.page/index.svelte' , { absolute: true } ) ).map(
		async filePath => ( {
			filePath ,
			page_key: JSON.parse(
				String(
					await FileSystem.readFile(
						Path.resolve( Path.dirname( filePath ) , 'metadata.json' ) ,
					) ,
				) ,
			).page_key ,
			relative: Path.relative( `${ process.cwd() }` , filePath ) ,
		} ) ,
	) ,
)
{
	console.info( `Cound of files: ${ targetFiles.length }` )
	await FileSystem.mkdir( './src/site/_build/_public_out' , {
		recursive: true ,
	} )
}

// MARK: First file
{
	const TARGET_PATH = './src/site/_build/_public_out/exports[builded].mjs' // Svelte exports content
	await FileSystem.writeFile(
		cwd_path( '.' , TARGET_PATH ) ,
		targetFiles
			.map(
				( { relative , page_key } ) =>
					`export {default as ${ page_key }} from '${ `#${ relative }` }';` ,
			)
			.join( '\n' ) ,
	)
	console.info( cwd_path( '.' , TARGET_PATH ) )
}

// MARK: Second File
{
	const ENUM_TARGET_PATH = './src/site/_build/_public_out/enum[builded].mjs' // ESJS content
	await FileSystem.writeFile(
		cwd_path( '.' , ENUM_TARGET_PATH ) ,
		`export default ${ JSON.stringify(
			targetFiles.map( ( { page_key } ) => page_key ) ,
			null ,
			'\t' ,
		) }` ,
	)
	console.info( cwd_path( '.' , ENUM_TARGET_PATH ) )
}
