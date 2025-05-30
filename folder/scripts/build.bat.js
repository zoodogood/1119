/** .bat */
// @echo off

// cd ../../

// echo "Node version:"
// call node -v || echo "ERROR: Need install Node.js" && exit /b

// echo "Install modules:"
// call npm install || echo "Unknow error" && exit /b

// echo "Check files:"
// call node ./folder/scripts/checkFiles.js || echo "Unknow error" && exit /b

// echo "Build bundle:"
// call rollup -c ./src/site/rollup.config.mjs || echo "Unknow error" && exit /b

// echo "Success!"

import process from 'node:process'
import get from '#src/nodejs/child-process-utils.js'

const PRODUCTION = ( await import( '#config' ) )?.default.development === false

const { run , info } = get( { root: process.cwd() , logger: true } )

const runtime = 'node'
const manager = 'pnpm'

await info( `${ runtime } version:` )
await run( runtime , [ '-v' ] )

await info( 'Install modules:' )
await run( manager , [ 'install' ] )

await info( 'Check files:' )
await run( runtime , [ './src/app/scripts/checkFiles.js' ] )

await info( 'Build bundle:' )
await run( manager , [ 'run' , 'site-build' ] )

await info( 'Clean' )
await run( manager , [ `prune ${ PRODUCTION ? '--prod' : '' }` ] )

await info( 'Success' )
