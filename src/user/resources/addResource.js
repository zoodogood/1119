import { assert } from '#src/assert/export.js'
import { userDataOf } from '#src/data/singleton.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'

export function addResource( {
	resource ,
	user ,
	value ,
	source ,
	context ,
	executor ,
} ) {
	if ( Number.isNaN( value ) ) {
		throw new TypeError( `Add NaN resource count` , {
			details: { source , resource } ,
		} )
	}

	assert( source )

	user.action( ActionsMap.resourceChange , {
		value ,
		executor ,
		source ,
		resource ,
		context ,
	} )
	userDataOf( user )[ resource ] ||= 0
	userDataOf( user )[ resource ] += value
}

export function addMultipleResources( {
	resources ,
	user ,
	source ,
	context ,
	executor ,
} ) {
	for ( const [ resource , value ] of Object.entries( resources ) ) {
		addResource( {
			user ,
			source ,
			context ,
			executor ,
			resource ,
			value ,
		} )
	}
}
