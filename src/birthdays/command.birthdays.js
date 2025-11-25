import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { singletonBotData , userDataOf } from '#src/data/singleton.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import { addResource } from '#src/user/resources/addResource.js'
import { CliParser } from '@zoodogood/utils/primitives'
import { DAY , SECOND } from '../constants/time.js'

class Birthdays {}

class BirthdayMember {
	PRICES_FOR_UPDATE_BIRTHDAY = [ 1_200 , 3_000 , 12_000 ]
	constructor( user ) {
		this.user = user
		this.userData = userDataOf( user )
	}

	calculateUpdatePrice() {
		return this.PRICES_FOR_UPDATE_BIRTHDAY[ this.userData.chestLevel ]
	}

	isValidDate( day , month ) {
		return day && month && day <= 31 && day >= 1 && month >= 1 && month <= 12
	}

	async processExistsBeforeUpdate( channel ) {
		const { userData , user } = this
		if ( !userData.BDay ) {
			return true
		}

		const price = this.calculateUpdatePrice()

		const message = await channel.msg( {
			title: `Вы уже устанавливали дату своего дня рождения, повторная смена будет стоить вам ${ price } коинов\nПродолжить?` ,
		} )
		const react = await message.awaitReact(
			{ user , removeType: 'all' } ,
			'685057435161198594' ,
			'763807890573885456' ,
		)

		if ( react !== '685057435161198594' ) {
			channel.msg( {
				title: 'Действие отменено' ,
				color: '#ff0000' ,
				delete: 4 * SECOND ,
			} )
			return false
		}
		if ( userData.coins < price ) {
			channel.msg( {
				title: 'Недостаточно коинов' ,
				color: '#ff0000' ,
				delete: 4 * SECOND ,
			} )
			return false
		}

		addResource( {
			user ,
			value: -price ,
			executor: user ,
			source: 'command.birthdays.member.update' ,
			resource: PropertiesEnum.coins ,
			context: this ,
		} )

		return true
	}

	async processUpdate( channel , value ) {
		const { user } = this
		const parsed = value.match( /\d\d\.\d\d/ )?.[ 0 ]

		const [ day , month ] = parsed?.split( '.' ).map( Number ) || []

		if ( !this.isValidDate( day , month ) ) {
			channel.msg( {
				title: 'Ожидалось значение в формате "19.11", — день, месяц' ,
				color: '#ff0000' ,
				delete: 5 * SECOND ,
			} )
			return
		}

		if ( !( await this.processExistsBeforeUpdate( channel ) ) ) {
			return
		}

		this.setBirhday( user , parsed )
		channel.msg( { title: 'Установлено! 🎉' , delete: 5 * SECOND } )
		return true
	}

	setBirhday( user , value ) {
		userDataOf( user ).BDay = value
		user.action( ActionsMap.globalQuest , { name: 'setBirthday' } )
	}
}

class MembersCommandManager {
	constructor( context ) {
		this.context = context
	}

	onProcess() {
		const { channel , guild } = this.context
		const splitDate = date => date.split( '.' ).map( Number )

		const [ currentDay , currentMonth ] = splitDate( singletonBotData().dayDate )
		const users = guild.members.cache
			.map( m => m.user )
			.filter( u => userDataOf( u ).BDay && !userDataOf( u ).profile_confidentiality )

		const sortByDate = ( userA , userB ) => {
			const [ aDay , aMonth ] = splitDate( userDataOf( userA ).BDay )
			const [ bDay , bMonth ] = splitDate( userDataOf( userB ).BDay )

			if ( aMonth !== bMonth ) {
				return ( -1 ) ** ( aMonth < bMonth )
			}

			if ( aDay !== bDay ) {
				return ( -1 ) ** ( aDay < bDay )
			}

			return 0
		}

		const usersByBirthdays = {
			inThisYear: [] ,
			inNextYear: [] ,
		}

		const checkInThisYear = ( day , month ) =>
			month > currentMonth || ( month === currentMonth && day >= currentDay )

		users.forEach( ( user ) => {
			const [ day , month ] = splitDate( userDataOf( user ).BDay )

			const inThisYear = checkInThisYear( day , month )

			inThisYear
				? usersByBirthdays.inThisYear.push( user )
				: usersByBirthdays.inNextYear.push( user )
		} )

		const sortedUsers
			= usersByBirthdays.inThisYear.length >= 20
				? usersByBirthdays.inThisYear.sort( sortByDate )
				: [
					... usersByBirthdays.inThisYear.sort( sortByDate ) ,
					... usersByBirthdays.inNextYear.sort( sortByDate ) ,
				]

		const daysTo = ( { date: [ day , month ] , current } ) => {
			const year = ( new Date ).getFullYear() + +!current
			const compare = new Date( `${ year }.${ month }.${ day }` )

			const diff = compare.getTime() - Date.now()
			return Math.ceil( diff / DAY )
		}

		const toField = ( user ) => {
			const isToday = userDataOf( user ).BDay === singletonBotData().dayDate
			const inThisYear = checkInThisYear( ... splitDate( userDataOf( user ).BDay ) )

			const dateContent = isToday ? 'сегодня! 🎁' : userDataOf( user ).BDay
			const inDaysContent = ` (через ${ daysTo( {
				current: inThisYear ,
				date: splitDate( userDataOf( user ).BDay ) ,
			} ) }д.)`
			const name = `${ dateContent }${ inDaysContent }`
			const value = user.tag
			return { name , value , inline: true }
		}

		const fields = sortedUsers.length
			? sortedUsers.slice( 0 , 20 ).map( toField )
			: [
				{
					name: 'Никто не установил дату своего дня рождения' ,
					value: 'Сделать это можно — `!нп др <date>`' ,
				} ,
			]

		const birthdaysToday = singletonBotData().clearParty || 0

		const title = '🎉 Дни рождения!'
		const description = `Здесь отображаются даты дней рождения пользователей, которые указали эту информацию`
		const footer = {
			text: birthdaysToday ? `Празднующих сегодня: ${ birthdaysToday }` : 'glhf' ,
		}

		channel.msg( { title , description , fields , footer } )
	}
}

class CommandRunContext extends BaseCommandRunContext {
	parseCli() {
		const parser = ( new CliParser ).setText( this.interaction.params )

		const parsed = parser
			.processBrackets()
			.captureFlags( this.command.options.cliParser.flags )
			.captureResidue( { name: 'rest' } )
			.collect()

		const values = parsed.resolveValues( capture => capture?.toString() )
		this.setCliParsed( parsed , values )
	}
}
class Command extends BaseCommand {
	options = {
		name: 'birthdays' ,
		id: 22 ,
		media: {
			description:
				'Отображает список ближайших именинников! :tada:\nНе забудьте поздравить их с праздником.' ,
			example: `!birthdays #без аргументов` ,
		} ,
		cliParser: {
			flags: [
				{
					name: '--set-birthday' ,
					capture: [ '--set-birthday' , '-sb' ] ,
					description: 'Установите дату своего дня рождения' ,
					expectValue: true ,
				} ,
			] ,
		} ,
		accessibility: {
			publicized_on_level: 5 ,
		} ,
		alias: 'parties праздники вечеринки днирождения др днінарождення' ,
		allowDM: true ,
		cooldown: 15 * SECOND ,
		type: 'user' ,
	}

	async onChatInput( msg , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	processDefaultBehavior( context ) {
		new MembersCommandManager( context ).onProcess()
	}

	processUpdateCommand( context ) {
		const { captures } = context.cliParsed.at( 0 )
		const value = captures.get( '--set-birthday' )?.valueOfFlag()
		if ( !value ) {
			return
		}
		const { channel } = context
		new BirthdayMember( context.user ).processUpdate( channel , value )
		return true
	}

	async run( context ) {
		context.parseCli()
		if ( this.processUpdateCommand( context ) ) {
			return
		}
		this.processDefaultBehavior( context )
	}
}

export default Command

export { BirthdayMember , Birthdays }
