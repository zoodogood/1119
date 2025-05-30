import { execSync } from 'node:child_process'
import { readPackageJson } from '#src/nodejs/readPackageJson.js'
import { path } from '#src/url/export.js'
import { svelte , vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const packageJSON = await readPackageJson()
// execSync( 'pnpm run site-build:build_stages' )

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
	cacheDir: _resolve( '#src/site/_build/.cache/.vite' ) ,
	get root() {
		const command = process.argv[ 2 ]
		switch ( command ) {
		case 'dev': return _resolve( '#src/site/_build/_public_out' )

		case 'build': return undefined

		default: {
			console.error( `\`vite ${ command }\` can be unstable: command "${ command }" is unknown. You may modify ${ import.meta.url } for control a "root" property that trigger this message.` )
			return undefined
		}
		}
	} ,
	build: {
		lib: {
			entry: [ _resolve( '#src/site/_build/index.js' ) ] ,
			name: 'bundle' ,
			fileName: 'bundle' ,
			formats: [ 'iife' ] ,
		} ,
		rollupOptions: {
			plugins: [
				( await import( 'rollup-plugin-polyfill-node' ) ).default() ,
				( await import( '@rollup/plugin-replace' ) ).default( {
					include: [ _resolve( '#src/site/_build/rollup-plugin-replace/template.js' ) ] ,
					preventAssignment: true ,
					values: ( await import( _resolve( '#src/site/_build/rollup-plugin-replace/values.js' ) ) ).default ,
				} ) ,
			] ,
		} ,
		outDir: './src/site/_build/_public_out/svelte-bundle' ,
		sourcemap: true ,
	} ,
} )
