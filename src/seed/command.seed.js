// @ts-check
import { DAY , HOUR , MINUTE , SECOND } from '#constants/time.js'
import BerryCommand from '#src/berry/command.berry.js'
import { client } from '#src/bot/client/singleton.js'
import { addCoinFromMessage } from '#src/coin_message/requestCoinFromMessage.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { DataManager , guildDataOf , singletonBotData , userDataOf } from '#src/data/singleton.js'
import { _do } from '#src/mini.js'
import { maybe_multiline , randomWith , timestampToDate } from '#src/safe-utils.js'
import { addResource } from '#src/user/resources/addResource.js'
import { codeOfEmoji } from '@zoodogood/utils/discordjs'
import { CustomCollector } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'

class CommandRunContext extends BaseCommandRunContext {
	berrysCollected = 0
	guildData
	interfaceMessage = null
	tree

	static new( interaction , command ) {
		const context = new this( interaction , command )
		context.guildData = guildDataOf( interaction.guild )
		context.tree = new Tree( interaction.guild )
		return context
	}

	setInterfaceMessage( message ) {
		this.interfaceMessage = message
		return this
	}
}

const COSTS_TABLE = [
	1 ,
	1 ,
	1 ,
	3 ,
	2 ,
	2 ,
	2 ,
	4 ,
	2 ,
	2 ,
	2 ,
	5 ,
	3 ,
	3 ,
	3 ,
	7 ,
	4 ,
	4 ,
	4 ,
	10 ,
]
const GLOBAL_MESSAGES_NEED_MULTIPLAYER = 0.3

const GROWTH_SPEED_TABLE = [
	0 ,
	0.4 ,
	0.6 ,
	0.9 ,
	1.25 ,
	2.5 ,
	3.75 ,
	5 ,
	6 ,
	7.8 ,
	10.5 ,
	12 ,
	21 ,
	27 ,
	33 ,
	42 ,
	54 ,
	72 ,
	126 ,
	180 ,
	225 ,
	396 ,
]

const MESSAGES_NEED_TABLE = [
	0 ,
	70 ,
	120 ,
	180 ,
	255 ,
	370 ,
	490 ,
	610 ,
	730 ,
	930 ,
	1270 ,
	1500 ,
	1720 ,
	2200 ,
	2700 ,
	3200 ,
	3700 ,
	4500 ,
	5400 ,
	7400 ,
	12000 ,
]

const TREE_ALIVE_WITHOUT_WATER_DAYS = 7

class Tree {
	get berry_growth_speed() {
		const has_damage = !!this.field.damage
		return GROWTH_SPEED_TABLE[ this.field.level ] * 2 ** +!has_damage
	}

	get end_of_day_messages_need() {
		const basic = MESSAGES_NEED_TABLE[ this.field.level ]

		const treeMistakesMultiplayer = 1 - 0.1 * ( this.field.damage || 0 )
		const globalMultiplayer = GLOBAL_MESSAGES_NEED_MULTIPLAYER
		const count = basic * globalMultiplayer * treeMistakesMultiplayer
		return Math.floor( count )
	}

	get upgrade_cost() {
		return COSTS_TABLE[ this.field.level ]
	}

	constructor( guild ) {
		this.guild = guild
		this.guildData = guildDataOf( guild )
		this.field = this.guildData.tree ||= {
			level: 0 ,
		}
	}

	berrys_actuallize() {
		const timePassed = Date.now() - this.field.entryTimestamp || 0
		const { berry_growth_speed } = this
		const limit = berry_growth_speed * 360

		const adding = ( timePassed / DAY ) * berry_growth_speed
		const berrys = ( this.field.berrys || 0 ) + adding
		this.field.berrys = Math.min( berrys , limit )

		this.field.entryTimestamp = Date.now()
	}
}

export function onDayStats( guild , eventContext ) {
	const guildData = guildDataOf( guild )
	const tree = new Tree( guild )
	const { end_of_day_messages_need } = tree

	tree.field.damage ||= 0

	if ( guildData.day_msg === 0 ) {
		tree.field.damage += 1
	}

	if ( guildData.day_msg < end_of_day_messages_need ) {
		tree.field.damage
			+= 0.2
				+ Number( ( 1 - guildData.day_msg / end_of_day_messages_need ).toFixed( 1 ) )

		eventContext.guildsStatsContext[ guild.id ] ||= {}
		eventContext.guildsStatsContext[ guild.id ].treeMessagesNeed
			= end_of_day_messages_need

		if ( tree.field.damage >= TREE_ALIVE_WITHOUT_WATER_DAYS ) {
			delete tree.field.damage
			tree.field.level--
		}

		return
	}

	tree.field.damage -= 0.2

	if ( tree.field.damage <= 0 ) {
		delete tree.field.damage
	}
}

class Command extends BaseCommand {
	options = {
		name: 'seed' ,
		id: 54 ,
		media: {
			description:
				'Клубничное дерево? М-м, вкусно, а говорят они на деревьях не ростут..\nОно общее и распространяется по серверу. Будет приносить ягоды, которые может собрать каждый\n_Будьте осторожны, растение может засохнуть, если на сервере недостаточно "актива"_' ,
			example: `!tree #без аргументов` ,
		} ,
		accessibility: {
			publicized_on_level: 15 ,
		} ,
		alias:
			'tree livetree семечко berrystree дерево клубничноедерево живоедерево' ,
		allowDM: true ,
		type: 'other' ,
	}

	THUMBNAIL_IMAGES_TABLE = [
		null ,
		'https://cdn.discordapp.com/attachments/629546680840093696/875367772916445204/t1.png' ,
		'https://cdn.discordapp.com/attachments/629546680840093696/875367713411858492/t2.png' ,
		'https://cdn.discordapp.com/attachments/629546680840093696/875367267318247444/t3.png' ,
		'https://cdn.discordapp.com/attachments/629546680840093696/875366344642662510/t4_digital_art_x4.png' ,
		'https://cdn.discordapp.com/attachments/629546680840093696/875366096952246312/t9.png' ,
	]

	becomeCoinMessage( { user } ) {
		const become = async ( user ) => {
			const filter = message => message.author.id === user.id
			const collector = new CustomCollector( {
				target: client ,
				event: 'message' ,
				filter ,
				time: MINUTE * 10 ,
			} )
			collector.setCallback( ( message ) => {
				collector.end()
				addCoinFromMessage( message )
			} )
		}

		!randomWith( 0 , 5 ) && become( user )
	}

	calculateBerrysTake( { tree , userData } ) {
		const isBerryMany = tree.field.berrys > tree.berry_growth_speed * 3

		const farmerBonus = userData.voidTreeFarm ?? 0

		const basic = 1 + farmerBonus
		const berryManyBonus = isBerryMany
			? randomWith( 0 , 3 + farmerBonus * 2 , { round: false } )
			: 0

		const berrys = basic + berryManyBonus

		return Math.floor( Math.min( berrys , tree.field.berrys ) )
	}

	calculateCooldown( context ) {
		const {
			berry_growth_speed ,
			field: { level } ,
		} = context.tree
		return Math.max( ( DAY / berry_growth_speed ) * ( 1 + level ) , HOUR * 2 )
	}

	createEmbed( context ) {
		const { tree } = context
		const {
			upgrade_cost ,
			guildData ,
			berry_growth_speed ,
			field: { level } ,
		} = tree
		tree.berrys_actuallize()

		const createFields = () => {
			const FIELDS = [
				{
					label: 'Не посажено' ,
					callback: () => ( {
						name: 'Рост' ,
						value:
							'Ему ещё предстоит вырасти, будучи семечком дерево не может давать плоды.\nОбязательно посадите семя, если оно у вас есть.\n\n❓ Выполняя каждый 50-й квест вы получаете по две штуки' ,
					} ) ,
					filter: () => level === 0 ,
				} ,
				{
					callback: () => {
						const { metric , count } = _do ( () => {
							switch ( true ) {
							case berry_growth_speed > 100:
								return {
									metric: 'минуту' ,
									count: berry_growth_speed / ( DAY / MINUTE ) ,
								}

							case berry_growth_speed > 10:
								return {
									metric: 'час' ,
									count: berry_growth_speed / ( DAY / HOUR ) ,
								}

							default:
								return { metric: 'день' , count: berry_growth_speed }
							}
						} )

						return {
							name: 'Плоды' ,
							value: maybe_multiline( [
								`Клубники выростает ${ count } <:berry:756114492055617558> в ${ metric }` ,
								`Готово для сбора: ${ Math.floor( tree.field.berrys ) }` ,
								`Следущая дозреет через: ${ timestampToDate(
									( ( 1 - ( tree.field.berrys % 1 ) ) * DAY ) / berry_growth_speed ,
									2 ,
								) }` ,
							] ) ,
						}
					} ,
					filter: () => level !== 0 ,
				} ,
				{
					callback: () => {
						const entrySeeds = tree.field.seedEntry || 0
						const forIncreaseNeed = `${
							upgrade_cost - entrySeeds > 5
								? upgrade_cost - entrySeeds
								: [ 'ноль' , 'одно' , 'два' , 'три' , 'четыре' , 'пять' ][
									upgrade_cost - entrySeeds
								]
						} ${ ending( upgrade_cost - entrySeeds , 'сем' , 'ян' , 'ечко' , 'ечка' , {
							unite: ( _quantity , word ) => word ,
						} ) }`
						return {
							name: 'Дерево' ,
							value: `Уровень деревца ${ level } ${
								level === 20
									? '(Максимальный)'
									: `\nДо повышения нужно ${ forIncreaseNeed }`
							}` ,
						}
					} ,
					filter: () => level !== 0 ,
				} ,
				{
					callback: () => {
						const { end_of_day_messages_need } = tree

						const status = tree.field.damage
							? end_of_day_messages_need <= guildData.day_msg
								? 'Дерево восстанавливается'
								: 'Следите, чтобы дерево не засохло'
							: end_of_day_messages_need <= guildData.day_msg
								? 'Дерево счастливо'
								: 'Дерево радуется'

						const value
							= end_of_day_messages_need <= guildData.day_msg
								? 'Необходимое количество сообщений уже собрано!'
								: `Сообщений собрано: ${ guildData.day_msg }/${ end_of_day_messages_need } ${
									tree.field.damage
										? `\nЗавянет через ${ +(
											TREE_ALIVE_WITHOUT_WATER_DAYS - tree.field.damage
										).toFixed( 1 ) } д.`
										: ''
								}`

						return { name: `💧 ${ status }` , value }
					} ,
					filter: () => level !== 0 ,
				} ,
				{
					callback: () => ( {
						name: 'Клубники собрали участники' ,
						value: `${ ending( context.berrysCollected , 'штук' , '' , 'а' , 'и' ) };` ,
					} ) ,
					filter: () => context.berrysCollected ,
				} ,
			]

			return FIELDS.filter( field => field.filter() ).map( field =>
				field.callback() ,
			)
		}

		return {
			title: 'Живое, клубничное дерево' ,
			thumbnail: this.THUMBNAIL_IMAGES_TABLE[ Math.ceil( level / 4 ) ] ,
			description: `Это растение способно принести океан клубники за короткий срок. Для этого заботьтесь о нём: общайтесь на сервере, поддерживайте теплую атмосферу, проводите время весело. Оно может может засохнуть!` ,
			fields: createFields() ,
			footer: {
				text: 'Ваши сообщения полностью заменяют собой воду, в том числе используются для полива растений' ,
				iconURL:
					'https://media.discordapp.net/attachments/629546680840093696/1065874615055958056/water.png' ,
			} ,
		}
	}

	async onBerryCollect( berrys , user , context ) {
		const { tree , channel } = context
		const userData = userDataOf( user )

		addResource( {
			user ,
			value: berrys ,
			resource: PropertiesEnum.berrys ,
			executor: user ,
			context ,
			source: 'command.seed.onBerryCollect' ,
		} )
		tree.field.berrys -= berrys
		context.berrysCollected += berrys

		singletonBotData().berrysPrice += berrys * BerryCommand.INFLATION
		await channel.msg( {
			title: 'Вы успешно собрали клубнику' ,
			author: { name: user.username , iconURL: user.avatarURL() } ,
			description: `${
				berrys > 5
					? berrys
					: [ 'Ноль' , 'Одна' , 'Две' , 'Три' , 'Четыре' , 'Пять' ][ berrys ]
			} ${ ending( berrys , 'ягод' , '' , 'а' , 'ы' , {
				unite: ( _quantity , word ) => word ,
			} ) } ${ ending( berrys , 'попа' , 'дают' , 'ла' , 'ли' , {
				unite: ( _quantity , word ) => word ,
			} ) } в ваш карман <:berry:756114492055617558>` ,
			delete: SECOND * 9 ,
		} )
		userData.CD_54 = Date.now() + this.calculateCooldown( context )

		this.becomeCoinMessage( { user } )

		if ( tree.field.berrys < 1 ) {
			context.interfaceMessage.reactions.resolve( '756114492055617558' ).remove()
		}
	}

	async onChatInput( msg , interaction ) {
		const context = CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	async onCollect( reaction , user , context ) {
		const { interfaceMessage , channel , tree } = context
		const react = codeOfEmoji( reaction.emoji )
		const userData = userDataOf( user )

		if ( react === '🌱' ) {
			if ( tree.field.level >= 20 ) {
				channel.msg( {
					title: 'Ещё больше?' ,
					description: `Не нужно, дерево уже максимального уровня!` ,
					author: { name: user.username , iconURL: user.avatarURL() } ,
					delete: SECOND * 9 ,
				} )
				interfaceMessage.reactions.resolve( '🌱' ).remove()
				return
			}

			if ( !userData.seed ) {
				channel.msg( {
					title: 'У вас нет Семян' ,
					description: `Где их достать? Выполняйте ежедневные квесты, каждый 50-й выполненый квест будет вознаграждать вас двумя семечками.` ,
					author: { name: user.username , iconURL: user.avatarURL() } ,
					delete: SECOND * 9 ,
				} )
				return
			}

			this.onSeedEntry( user , context )
		}

		// Berry take
		if ( react === '756114492055617558' ) {
			if ( userData.CD_54 > Date.now() ) {
				channel.msg( {
					title: 'Перезарядка...' ,
					description: `Вы сможете собрать клубнику только через **${ timestampToDate(
						userData.CD_54 - Date.now() ,
						2 ,
					) }**` ,
					footer: { text: 'Перезарядка уменьшается по мере роста дерева' } ,
					author: { name: user.username , iconURL: user.avatarURL() } ,
					delete: SECOND * 9 ,
					color: '#ff0000' ,
				} )
				return
			}

			if ( tree.field.berrys < 1 ) {
				channel.msg( {
					title: 'Упс..!' ,
					description:
						'На дереве закончилась клубника. Возможно, кто-то успел забрать клубнику раньше вас.. Ждите, пока дозреет следущая, не упустите её!' ,
					author: { name: user.username , iconURL: user.avatarURL() } ,
					delete: SECOND * 9 ,
					color: '#ff0000' ,
				} )
				return
			}

			const berrys = this.calculateBerrysTake( {
				tree ,
				userData ,
			} )
			this.onBerryCollect( berrys , user , context )
		}

		const embed = this.createEmbed( context )
		await interfaceMessage.msg( { ... embed , edit: true } )
	}

	async onLevelUp( context ) {
		const { interfaceMessage , channel , tree } = context
		tree.field.seedEntry = 0
		tree.field.level = ( tree.field.level ?? 0 ) + 1
		context.costsUp = COSTS_TABLE[ tree.field.level ]
		tree.field.berrys++

		await interfaceMessage.react( '756114492055617558' )

		channel.msg( {
			title: 'Дерево немного подросло' ,
			description: `После очередного семечка 🌱, дерево стало больше и достигло уровня ${ context.level }!` ,
		} )
		delete tree.field.damage
	}

	onSeedEntry( user , context ) {
		const { channel , tree } = context
		addResource( {
			user ,
			value: -1 ,
			resource: PropertiesEnum.seed ,
			executor: user ,
			context ,
			source: 'command.seed.onSeedEntry' ,
		} )
		tree.field.seedEntry = ( tree.field.seedEntry ?? 0 ) + 1
		channel.msg( {
			title: `Спасибо за семечко, ${ user.username }` ,
			description: `🌱 ` ,
			delete: SECOND * 9 ,
		} )

		if ( tree.field.seedEntry >= tree.upgrade_cost ) {
			this.onLevelUp( context )
		}
	}

	async run( context ) {
		const { channel , tree } = context
		const embed = this.createEmbed( context )
		context.setInterfaceMessage( await channel.msg( embed ) )

		const { interfaceMessage } = context

		if ( tree.field.level < 20 ) {
			await interfaceMessage.react( '🌱' )
		}

		if ( tree.field.berrys >= 1 ) {
			await interfaceMessage.react( '756114492055617558' )
		}

		const filter = ( reaction , user ) =>
			user.id !== client.user.id
			&& ( reaction.emoji.name === '🌱'
				|| reaction.emoji.id === '756114492055617558' )
		const collector = interfaceMessage.createReactionCollector( {
			filter ,
			time: MINUTE * 3 ,
		} )
		collector.on( 'collect' , async ( reaction , user ) => {
			this.onCollect( reaction , user , context )
		} )

		collector.on( 'end' , interfaceMessage.reactions.removeAll )
	}
}

export default Command
