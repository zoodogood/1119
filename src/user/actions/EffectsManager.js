import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import { createDefaultPreventable } from '#src/createDefaultPreventable.js'
import { takeInteractionProperties } from '#src/discord/utils.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { uid } from '#src/safe-utils.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import { Collection } from '@discordjs/collection'
import { glob } from 'glob'

const EFFECTS_PATH = './folder/userEffects'
const EffectInfluenceEnum = {
	Negative: 'Negative' ,
	Neutral: 'Neutral' ,
	Positive: 'Positive' ,
	Scary: 'Scary' ,
	Nothing: 'Nothing' ,
}

class Core {
	/**
	 * @type {Collection<string, BaseEffect>}
	 */
	static store = ( new Collection )

	static applyEffect( { effect , effectBase , user , context } ) {
		const effects = ( userDataOf( user ).effects ||= [] )
		const callbackMap = ( userDataOf( user ).effectsCallbackMap ||= {} )

		Object.keys( effectBase.callback ).forEach( ( callbackKey ) => {
			callbackMap[ callbackKey ] = true
		} )

		const _context = new BaseContext(
			`effectsManager.applyEffect.${ effect.id }` ,
			{
				primary: context ,
				... takeInteractionProperties( context ) ,
				effect ,
				... createDefaultPreventable() ,
			} ,
		)
		user.action( ActionsMap.beforeEffectInit , _context )

		if ( _context.defaultPrevented() ) {
			return
		}

		if ( effect.values.timer ) {
			const params = [ user.id , effect.uid ]
			timeEvents_singleton.pushIntoBuffer(
				'effect-end' ,
				effect.values.timer ,
				params ,
			)
		}

		effects.push( effect )
		user.action( ActionsMap.effectInit , _context )
		return _context
	}

	static cleanCallbackMap( user ) {
		const effects = userDataOf( user ).effects
		if ( !userDataOf( user ).effectsCallbackMap ) {
			return
		}

		const needRemove = callbackKey =>
			!effects.some( ( { id } ) => callbackKey in Core.store.get( id ).callback )
		const callbackMap = userDataOf( user ).effectsCallbackMap
		Object.keys( callbackMap )
			.filter( needRemove )
			.forEach( key => delete callbackMap[ key ] )
	}

	static createOfBase( { effectBase , user , context = {} } ) {
		const effect = {
			id: effectBase.id ,
			uid: uid() ,
			createdAt: Date.now() ,
			values: {} ,
		}

		for ( const [ key , valueField ] of Object.entries( effectBase.values ) ) {
			const value
				= typeof valueField === 'function'
					? valueField( user , effect , context )
					: valueField

			effect.values[ key ] = value
		}

		return effect
	}

	static removeEffect( { effect , user } ) {
		Core.setRemoved( effect , true )

		const index = userDataOf( user ).effects.indexOf( effect )
		if ( index === -1 ) {
			return null
		}

		user.action( ActionsMap.effectRemove , { effect , index } )
		userDataOf( user ).effects.splice( index , 1 )
	}

	static setDisabled( effect , value ) {
		effect.isDisabled = value
	}

	static setRemoved( effect , value ) {
		effect.isRemoved = value
	}
}

class EffectInterface {
	static from( data ) {
		return Object.assign( Object.create( EffectInterface.prototype ) , data )
	}

	remove() {
		const { user , effect } = this
		Core.removeEffect( { effect , user } )
	}

	setDisabled( value ) {
		Core.setDisabled( this.effect , value )
	}

	setRemoved( value ) {
		Core.setRemoved( this.effect , value )
	}
}

class UserEffectManager {
	static _removeEffect = Core.removeEffect

	static applyEffect = Core.applyEffect

	static cleanCallbackMap = Core.cleanCallbackMap

	static createOfBase = Core.createOfBase

	static store = Core.store

	static effectsOf( { user } ) {
		return userDataOf( user ).effects || []
	}

	static async importEffects() {
		const effects = await Promise.all(
			( await glob( '**/*.effect.js' , { absolute: true } ) ).map( path =>
				import( path ).then( module => new BaseEffect( module.default ) ) ,
			) ,
		)

		for ( const effect of effects ) {
			this.registerEffect( effect )
		}
	}

	static indexOf( { user , effect } ) {
		return this.effectsOf( { user } ).indexOf( effect )
	}

	static interface( { user , effect } ) {
		return EffectInterface.from( { user , effect } )
	}

	static justEffect( {
		effectId ,
		user ,
		values = {} ,
		context = {} ,
		call = true ,
	} ) {
		const effectBase = this.store.get( effectId )
		const effect = this.createOfBase( { effectBase , user , context } )
		Object.assign( effect.values , values )
		return call && this.applyEffect( { effect , effectBase , user , context } )
	}

	static registerEffect( base ) {
		const { id } = base
		this.store.set( id , base )
	}

	static removeEffect( { effect , user } ) {
		this.removeEffects( { list: [ effect ] , user } )
	}

	static removeEffects( { list , user } ) {
		for ( const effect of list ) {
			this._removeEffect( { effect , user } )
		}

		this.cleanCallbackMap( user )
	}
}

class BaseEffect {
	/**
	 * @type {Record<keyof typeof ActionsMap, (user: import("discord.js").User, effect: {}, data: {}) => unknown>}
	 */
	callback = {}
	/** @type {boolean?} */
	canPrevented
	/** @type {string} */
	id
	/**
	 * @property {number} [timer]
	 */
	values = {}
	constructor( data ) {
		Object.assign( this , data )
		data.onConstruct?.()
	}
}

export default UserEffectManager
export { BaseEffect , EffectInfluenceEnum , UserEffectManager }
