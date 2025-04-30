import EventEmitter from 'node:events'
import { userDataOf } from '#src/data/singleton.js'
import { addResource } from '#src/user/resources/addResource.js'
import CustomIdExecutor from '#src/app/CustomIdExecutor/Executor.js'
import { createDefaultPreventable } from '#src/createDefaultPreventable.js'
import { cursesBase } from '#src/curses/CurseManager/curses/curses.js'
import { _interface } from '#src/curses/CurseManager/singleton/public.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { ErrorsHandler } from '#src/ErrorsHandler/ErrorsHandler.js'
import { sendErrorInfo } from '#src/ErrorsHandler/sendErrorInfo.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { toLocaleDeveloperString } from '#src/safe-utils.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import { _WEIGHT_AUTO , randomElementFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'

class CurseManager {
	static cursesBase
	static emitter = ( new EventEmitter )
	static Events = {
		CurseEnd: 'CurseEnd' ,
	}

	static _curseEnd( { lost , user , curse } ) {
		this.emitter.emit( CurseManager.Events.CurseEnd , user , curse , {
			isLost: lost ,
		} )
		user.action( ActionsMap.curseEnd , { isLost: lost , curse } )
		this.removeCurse( { user , curse } )
	}

	static checkAvailable( { curse , user } ) {
		if ( !curse ) {
			return null
		}
		const { values } = curse

		if (
			values.goal
			&& !isNaN( values.progress )
			&& values.progress >= values.goal
		) {
			this.curseIndexOnUser( { curse , user } ) !== null
			&& CurseManager.curseEnd( { user , curse , lost: false } )

			return
		}

		if ( values.timer && Date.now() > curse.timestamp + values.timer ) {
			const context = {
				curse ,
				... createDefaultPreventable() ,
			}
			user.action( ActionsMap.curseTimeEnd , context )
			if ( !context.defaultPrevented() ) {
				this.curseIndexOnUser( { curse , user } ) !== null
				&& CurseManager.curseEnd( { user , curse , lost: true } )
			}
		}
	}

	static checkAvailableAll( user ) {
		userDataOf( user ).curses?.forEach( curse => this.checkAvailable( { curse , user } ) )
	}

	static curseEnd( { lost , user , curse } ) {
		this._curseEnd( { lost , user , curse } )

		const curseBase = cursesBase.get( curse.id )

		const getDefaultFields = () => {
			const fields = []
			fields.push( {
				name: 'Прогресс:' ,
				value: Object.entries( curse.values )
					.map(
						( [ key , value ] ) => `${ key }: \`${ toLocaleDeveloperString( value ) }\`` ,
					)
					.join( '\n' ) ,
			} )

			fields.push( {
				name: 'Основа:' ,
				value: Object.entries( curseBase )
					.map(
						( [ key , value ] ) => `${ key }: \`${ toLocaleDeveloperString( value ) }\`` ,
					)
					.join( '\n' ) ,
			} )

			fields.push( {
				name: 'Другое:' ,
				value: `Дата создания: <t:${ Math.floor( curse.timestamp / 1000 ) }>` ,
			} )

			fields
				.filter( field => field.value.length > 1024 )
				.forEach( field => ( field.value = `${ field.value.slice( 0 , 1021 ) }...` ) )

			return fields
		}

		if ( lost ) {
			addResource( {
				user ,
				executor: null ,
				value: userDataOf( user ).level > 1 ? -1 : 0 ,
				resource: PropertiesEnum.level ,
				source: `curseManager.curse.onEnd.lost.${ curse.id }` ,
				context: { curse } ,
			} )
			const fields = getDefaultFields()
			const image
				= 'https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif'
			user.msg( {
				title: 'Вы не смогли его одолеть 💀' ,
				description:
					'Проклятие не было остановлено, а последствия необратимы. Вы теряете один уровень и, возможно, что-то ещё.' ,
				fields ,
				color: '#000000' ,
				image ,
			} )
			return
		}

		if ( !lost ) {
			userDataOf( user ).cursesEnded = ( userDataOf( user ).cursesEnded ?? 0 ) + 1
			const fields = getDefaultFields()

			const getVoidReward = () => {
				const BASIC_ODDS = 20
				const REDUCTION_FOR_HARD = 0.25
				const comparator = BASIC_ODDS * REDUCTION_FOR_HARD ** curseBase.hard

				return Number( Math.random() < 1 / comparator )
			}
			const voidReward = getVoidReward()

			const getCoinsReward = () => {
				const BASIC_REWARD = 120
				const ADDING_REWARD = 55
				const { interactionIsLong , interactionIsShort } = curseBase
				const stable
					= ( BASIC_REWARD + ADDING_REWARD * curseBase.hard ) * curseBase.reward

				return Math.ceil(
					stable
					* ( interactionIsLong ? 1.2 : 1 )
					* ( interactionIsShort ? 1 / 1.2 : 1 ) ,
				)
			}
			const coinsReward = getCoinsReward()

			addResource( {
				user ,
				value: coinsReward ,
				source: `curseManager.curse.onEnd.success.${ curseBase.id }` ,
				executor: null ,
				resource: PropertiesEnum.coins ,
				context: { curse } ,
			} )
			addResource( {
				user ,
				value: voidReward ,
				source: `curseManager.curse.onEnd.success.${ curseBase.id }` ,
				executor: null ,
				resource: PropertiesEnum.void ,
				context: { curse } ,
			} )

			const rewardContent = `${ ending( coinsReward , 'коин' , 'ов' , '' , 'а' ) }${
				voidReward
					? ` и ${ ending( voidReward , 'нестабильност' , 'и' , 'ь' , 'и' ) }`
					: ''
			}`
			const descriptionFooter = `${
				coinsReward ? '<:coin:637533074879414272>' : ''
			} ${ voidReward ? '<a:void:768047066890895360>' : '' }`
			const description = `Это ${ userDataOf( user ).cursesEnded }-й раз, когда Вам удаётся преодолеть условия, созданные нашей машиной для генерации проклятий.\nВ этот раз вы получаете: ${ rewardContent }. Награда такая незначительная в связи с тем, что основным поставщиком ресурсов является сундук. Да будь он проклят!\n${ descriptionFooter }`

			const image
				= 'https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif'

			user.msg( {
				title: 'Проклятие снято 🔆' ,
				description ,
				fields ,
				color: '#000000' ,
				image ,
			} )
		}
	}

	static curseIndexOnUser( { curse , user } ) {
		const index = userDataOf( user ).curses.indexOf( curse )
		if ( index === -1 ) {
			return null
		}

		return index
	}

	static generate( { hard = null , user , context } ) {
		const MAXIMAL_HARD = 2
		if ( hard > MAXIMAL_HARD ) {
			hard = MAXIMAL_HARD
		}

		const curseBase = randomElementFromArray(
			this.getGeneratePull( user , context )
				.filter( curseBase => hard === null || curseBase.hard === hard ) ,
			{
				associatedWeights: _WEIGHT_AUTO ,
			} ,
		)

		const curse = this.generateOfBase( { user , curseBase , context } )
		return curse
	}

	static generateOfBase( { curseBase , user , context } ) {
		const curse = {
			id: curseBase.id ,
			values: {} ,
			timestamp: Date.now() ,
		}

		Object.entries( curseBase.values ).forEach(
			( [ key , callback ] ) =>
				( curse.values[ key ] = callback.call( curseBase , user , curse , context ) ) ,
		)

		return curse
	}

	static getGeneratePull( user , context ) {
		return [ ... cursesBase.values() ].filter(
			curseBase =>
				!curseBase.filter || curseBase.filter.call( curseBase , user , context ) ,
		)
	}

	static init( { curse , user } ) {
		if ( !userDataOf( user ).curses ) {
			userDataOf( user ).curses = []
		}

		userDataOf( user ).curses.push( curse )
		const curseBase = cursesBase.get( curse.id )
		const callbackMap = ( userDataOf( user ).cursesCallbackMap ||= {} )
		Object.keys( curseBase.callback ).map( key => ( callbackMap[ key ] = true ) )

		if ( curse.values.timer ) {
			const args = [ user.id , curse.timestamp ]
			timeEvents_singleton.pushIntoBuffer(
				'curse-timeout-end' ,
				curse.values.timer ,
				args ,
			)
		}

		user.action( ActionsMap.curseInit , { curse } )
	}

	static interface( { curse , user } ) {
		return new _interface( curse , user )
	}

	static removeCurse( { user , curse } ) {
		const index = this.curseIndexOnUser( { curse , user } )
		if ( index === null ) {
			return null
		}

		userDataOf( user ).curses.splice( index , 1 )

		const keysToRemove = callbackKey =>
			!userDataOf( user ).curses.some(
				( { id } ) => callbackKey in cursesBase.get( id ).callback ,
			)

		const callbackMap = userDataOf( user ).cursesCallbackMap
		Object.keys( callbackMap )
			.filter( keysToRemove )
			.forEach( key => delete callbackMap[ key ] )
	}
}

CustomIdExecutor.bind( 'curseManager' , ( target , { params , interaction } ) => {
	if ( target === 'events' ) {
		const [ event , ... parsed ] = params.split( ':' )
		const base = cursesBase.get( event )
		try {
			base.onComponent.call( base , { interaction , params: parsed } )
		} catch ( error ) {
			ErrorsHandler.onErrorReceive( error )
			sendErrorInfo( {
				error ,
				channel: interaction.channel ,
				interaction ,
				description: `${ target }/${ params }` ,
			} )
		}
	}
} )

export { CurseManager }
