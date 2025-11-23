import { SECOND } from '#src/constants/time.js'
import { cursesBase } from '#src/curses/CurseManager/curses/curses.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import { CurseManager } from './index.js'

export function resolve_description( { curse , user , curseBase } ) {
	curseBase ||= cursesBase.get( curse.id )
	const { description } = curseBase
	return typeof description === 'function'
		? description.call( curseBase , user , curse )
		: description
}

export class _interface {
	constructor( curse , user ) {
		this.curse = curse
		this.user = user
	}

	_setProgress( value ) {
		const { curse } = this
		curse.values.progress = value
		return curse.values.progress
	}

	fail() {
		const { curse , user } = this
		CurseManager.curseIndexOnUser( { curse , user } ) !== null
		&& CurseManager.curseEnd( { lost: true , user , curse } )
	}

	incrementProgress( value ) {
		const { curse , user } = this
		this.setProgress( ( +curse.values.progress || 0 ) + value )
		CurseManager.checkAvailable( { curse , user } )
		return curse.values.progress
	}

	setProgress( value ) {
		const { user , curse } = this
		user.action( ActionsMap.curseBeforeSetProgress )
		this._setProgress( value )
		CurseManager.checkAvailable( { curse , user } )
		return curse.values.progress
	}

	silentEnd() {
		const { curse , user } = this
		CurseManager.curseIndexOnUser( { curse , user } ) !== null
		&& CurseManager._curseEnd( { lost: false , user , curse } )
	}

	success() {
		const { curse , user } = this
		CurseManager.curseIndexOnUser( { curse , user } ) !== null
		&& CurseManager.curseEnd( { lost: false , user , curse } )
	}

	toString() {
		const { curse , user } = this
		const curseBase = cursesBase.get( curse.id )

		if ( Object.hasOwnProperty.call( curseBase , 'toString' ) ) {
			return curseBase.toString( user , curse )
		}

		const description = resolve_description( { curse , user , curseBase } )
		const progressContent = curse.values.goal
			? `Прогресс: ${ curse.values.progress || 0 }/${ curse.values.goal }`
			: `Прогресс: ${ curse.values.progress || 0 }`

		const timer = curse.values.timer
			? `\nТаймер: <t:${ Math.floor(
				( curse.timestamp + curse.values.timer ) / SECOND ,
			) }:R> будет провалено`
			: ''

		const content = `${ description }\n${ progressContent }${ timer }`
		return content
	}
}
