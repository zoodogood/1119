import childProcessUtils from '#src/nodejs/child-process-utils.js'
import { CliParser } from '@zoodogood/utils/CliParser'

class AppCli {
	callbacks = {
		'--on-ready': async ( capture , value ) => {
			if ( !value ) {
				return
			}
			const { run } = childProcessUtils( { root: process.cwd() } )
			run( process.env.SHELL , [ '-c' , value ] )
		} ,
	}

	flags = [ { name: '--on-ready' , expectValue: true , capture: [ '--on-ready' ] } ]
	setCliParsed( parsed , values ) {
		this.cliParsed = [ parsed , values ]
	}
}

const manager = ( new AppCli )
const SYSTEM_ARGV_COUNT = 2
const params = process.argv.slice( SYSTEM_ARGV_COUNT ).join( ' ' )
const parsed = ( new CliParser )
	.setText( params )
	.processBrackets()
	.captureFlags( manager.flags )
	.collect()

const values = parsed.resolveValues( capture => capture?.toString() )
parsed.captures.forEach( ( capture , key ) => {
	manager.callbacks[ key ]?.( capture , values.get( key ) )
} )
manager.setCliParsed( parsed , values )
