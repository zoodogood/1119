import FileSystem from 'node:fs/promises'
import Path from 'node:path'
import { accrueAsync , arrayFlatFactory , arrayMapFactory , arrayMapProperty , arrayParallerTaskFactory , promiseAll } from '#src/accrue/accrue.js'
import { file_symlink_auto } from '#src/nodejs/FileSystem/helpers.js'
import { process } from '#src/nodejs/process/export.js'
import { relativeToProjectRoot } from '#src/projectRootPath.js'
import { SITE_PUBLIC_DIR_PATH } from '#src/site/constants.js'
import { glob } from 'glob'

const _registered_stages = []
function defineStage( name , callback ) {
	_registered_stages.push( { name , callback } )
}

/**
 * Input: none
 * Output behavior: build a working exports[builded].js file with list of pages
 */
// MARK: PagesExport
defineStage( 'createPagesExports' , async () => {
	const targetFiles = await Promise.all(
		( await glob( '**/*.page/index.svelte' , { absolute: true } ) ).map(
			async filePath => ( {
				filePath ,
				page_key: JSON.parse(
					String(
						await FileSystem.readFile(
							Path.resolve( filePath , '..' , 'metadata.json' ) ,
						) ,
					) ,
				).page_key ,
				relative: Path.relative( `${ process.cwd() }` , filePath ) ,
			} ) ,
		) ,
	)
	{
		console.info( `Cound of files: ${ targetFiles.length }` )
		await FileSystem.mkdir( './src/site/build/_public_out' , {
			recursive: true ,
		} )
	}

	// MARK: = first
	{
		const TARGET_PATH = relativeToProjectRoot( SITE_PUBLIC_DIR_PATH , 'exports[builded].mjs' )
		// Svelte exports content
		await FileSystem.writeFile(
			TARGET_PATH ,
			targetFiles
				.map(
					( { relative , page_key } ) =>
						`export {default as ${ page_key }} from '${ `#${ relative }` }';` ,
				)
				.join( '\n' ) ,
		)
		console.info( TARGET_PATH )
	}

	// MARK: = second
	{
		const ENUM_TARGET_PATH = relativeToProjectRoot( SITE_PUBLIC_DIR_PATH , 'enum[builded].mjs' )
		await FileSystem.writeFile(
			ENUM_TARGET_PATH ,
			`export default ${ JSON.stringify(
				targetFiles.map( ( { page_key } ) => page_key ) ,
				null ,
				'\t' ,
			) }` ,
		)
		console.info( ENUM_TARGET_PATH )
	}
} )

// MARK: Unprivate
defineStage( 'Make files public' , async () => {
	accrueAsync(
		glob( '**/site.build.config.json' , { absolute: true } ) ,
		arrayMapFactory( p =>
			accrueAsync(
				p ,
				FileSystem.readFile ,
				String ,
				JSON.parse ,
				x => x.bundle ,
				Object.entries ,
				arrayMapProperty( '0' , source => Path.resolve( p , '..' , source ) ) ,
				arrayMapProperty( '1' , destination => Path.join( `${ process.cwd() }/src/site/build/_public_out` , destination ) ) ,
			) ,
		) ,
		promiseAll ,
		arrayFlatFactory() ,
		arrayParallerTaskFactory( ( [ existingPath , destination ] ) => file_symlink_auto( existingPath , destination ) ) ,
	)
} )

for ( const stage of _registered_stages ) {
	console.info( stage.name.toUpperCase() )
	await stage.callback()
}
