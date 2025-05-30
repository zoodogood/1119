import { execSync } from 'node:child_process'
import { app_build_name_of_run_build } from '#src/app/build/export.js'
import config from '#src/config.json.js'
import { SECOND } from '#src/constants/time.js'
import { readPackageJson } from '#src/nodejs/readPackageJson.js'
import { sleep } from '#src/safe-utils.js'
import { path } from '#src/url/export.js'
import { svelte , vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const packageJSON = await readPackageJson()
if ( !config.development ) {
	execSync( app_build_name_of_run_build() )
} else {
	console.info( `Please call «${ app_build_name_of_run_build() }» manually` )
	await sleep( SECOND )
}

function _resolve( specifier : string ) {
	const { imports } = packageJSON
	const [ maybe , ... rest ] = specifier.split( '/' )
	const replacment = Object.entries( imports ).find( ( [ key , value ] ) =>
		key.startsWith( maybe ) ,
	)?.[ 1 ] as string | undefined
	if ( replacment ) {
		specifier = replacment.replace( '*' , rest.join( '/' ) )
	}
	// To project root folder
	const root = path.resolve( __dirname , '../../..' )
	return path.resolve( root , specifier )
}

export default defineConfig( {
	plugins: [
		svelte( {
			preprocess: vitePreprocess() ,
		} ) ,
	] ,
	base: '/public' ,
	cacheDir: _resolve( '#src/site/build/.cache/.vite' ) ,
	get root() {
		const command = process.argv[ 2 ]
		switch ( command ) {
		case 'dev': return _resolve( '#src/site/build/_public_out' )

		case 'build': return undefined

		default: {
			console.error( `\`vite ${ command }\` can be unstable: command "${ command }" is unknown. You may modify ${ import.meta.url } for control a "root" property that trigger this message.` )
			return undefined
		}
		}
	} ,
	build: {
		lib: {
			entry: [ _resolve( '#src/site/build/index.js' ) ] ,
			name: 'bundle' ,
			fileName: 'bundle' ,
			formats: [ 'iife' ] ,
		} ,
		rollupOptions: {
			plugins: [
				( await import( 'rollup-plugin-polyfill-node' ) ).default() ,
				( await import( '@rollup/plugin-replace' ) ).default( {
					include: [ _resolve( '#src/site/build/rollup-plugin-replace/template.js' ) ] ,
					preventAssignment: true ,
					values: ( await import( _resolve( '#src/site/build/rollup-plugin-replace/values.js' ) ) ).default ,
				} ) ,
			] ,
		} ,
		outDir: './src/site/build/_public_out/svelte-bundle' ,
		sourcemap: true ,
	} ,
} )
