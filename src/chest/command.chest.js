import {
	KEYS_TO_UPGRADE_CHEST_TO_LEVEL_2 ,
	KEYS_TO_UPGRADE_CHEST_TO_LEVEL_3 ,
} from '#src/chest/constants.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import CooldownManager from '#src/CooldownManager.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { singletonBotData , userDataOf } from '#src/data/singleton.js'
import dayjs from '#src/dayjs.js'
import {
	NumberFormatLetterize ,
	randomWith ,
	sleep ,
	timestampToDate ,
} from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import { addResource } from '#src/user/resources/addResource.js'
import { _WEIGHT_AUTO , randomElementFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'

function ending_with_normalize(
	quantity ,
	base ,
	multiple ,
	alone ,
	double ,
	options = {} ,
) {
	options.unite = ( quantity , end ) => end
	const end = ending( quantity , base , multiple , alone , double , options )
	return `${ NumberFormatLetterize( quantity ) } ${ end }`
}

export const Chest = {
	TREASURES_PULL: [
		[
			{ item: 'void' , quantity: 1 , _weight: 1 } ,
			{ item: 'berrys' , quantity: 1 , _weight: 4 } ,
			{ item: 'keys' , quantity: randomWith( 2 , 3 ) , _weight: 9 } ,
			{ item: 'trash' , quantity: 0 , _weight: 13 } ,
			{ item: 'exp' , quantity: randomWith( 1 , 7 ) , _weight: 22 } ,
			{ item: 'coins' , quantity: randomWith( 23 , 40 ) , _weight: 46 } ,
			{ item: 'chilli' , quantity: 1 , _weight: 4 } ,
			{ item: 'thiefGloves' , quantity: 1 , _weight: 1 } ,
		] ,
		[
			{ item: 'void' , quantity: 1 , _weight: 1 } ,
			{ item: 'berrys' , quantity: randomWith( 1 , 2 ) , _weight: 8 } ,
			{ item: 'keys' , quantity: randomWith( 3 , 5 ) , _weight: 7 } ,
			{ item: 'trash' , quantity: 0 , _weight: 3 } ,
			{ item: 'exp' , quantity: randomWith( 3 , 10 ) , _weight: 22 } ,
			{ item: 'coins' , quantity: randomWith( 88 , 148 ) , _weight: 54 } ,
			{ item: 'chilli' , quantity: 1 , _weight: 3 } ,
			{ item: 'thiefGloves' , quantity: 1 , _weight: 2 } ,
		] ,
		[
			{ item: 'void' , quantity: 1 , _weight: 1 } ,
			{ item: 'berrys' , quantity: randomWith( 1 , 3 ) , _weight: 12 } ,
			{ item: 'keys' , quantity: 9 , _weight: 1 } ,
			{ item: 'exp' , quantity: randomWith( 5 , 12 ) , _weight: 22 } ,
			{ item: 'coins' , quantity: randomWith( 304 , 479 ) , _weight: 62 } ,
			{ item: 'thiefGloves' , quantity: 1 , _weight: 1 } ,
			{ item: 'bonus' , quantity: 5 , _weight: 1 } ,
		] ,
	] ,

	applyTreasures( { user , treasures , context } ) {
		const apply = ( item , quantity ) => {
			switch ( item ) {
			case 'trash':
				break

			default:
				addResource( {
					user ,
					value: quantity ,
					executor: user ,
					source: 'chestManager.applyTreasures' ,
					resource: item ,
					context: { treasures , context } ,
				} )
				break
			}
		}

		Object.entries( treasures ).forEach( ( [ item , quantity ] ) =>
			apply( item , quantity ) ,
		)
	} ,

	calculateOpenCount( { toOpen } ) {
		const bonuses = Math.max( 0 , toOpen )
		return randomWith( 2 ) + Math.ceil( bonuses / 3 )
	} ,

	callOpen( { user , toOpen } ) {
		const count = this.calculateOpenCount( { user , toOpen } )
		return this.getResources( { user , openCount: count } )
	} ,

	getResources( { user , openCount } ) {
		const userData = userDataOf( user )

		const pushTreasure = ( item , quantity ) =>
			( treasures[ item ] = treasures[ item ]
				? quantity + treasures[ item ]
				: quantity )
		const treasuresPull = this.TREASURES_PULL[ userData.chestLevel ?? 0 ]
		const treasures = {}

		let i = openCount
		while ( i > 0 ) {
			i--
			const { item , quantity } = randomElementFromArray( treasuresPull , { associatedWeights: _WEIGHT_AUTO } )
			switch ( item ) {
			case 'bonus':
				i += quantity
				openCount += quantity
			}
			pushTreasure( item , quantity )
		}

		return { treasures , openCount }
	} ,
}

export class ChestManager {
	static cooldown = {
		key: 'CD_32' ,
		for( userData ) {
			const cooldown = CooldownManager.api( userData , this.key )
			cooldown.install = function () {
				const timestamp = +dayjs().endOf( 'date' )
				this.setLoadFullyEndAt( timestamp )
				return this
			}

			return cooldown
		} ,
	}

	static handleTreasure( item , quantity , user ) {
		switch ( item ) {
		case 'keys':
			if ( quantity > 99 ) {
				user.action( Actions.globalQuest , { name: 'bigHungredBonus' } )
			}
			break
		}
	}

	static open( { user , context } ) {
		const toOpen = Math.max( 0 , userDataOf( user ).chestBonus ) || 0
		this.processBirthday( { user , context } )

		const { treasures , openCount } = Chest.callOpen( { user , toOpen } )
		this.procesBefore( { user , context , treasures , openCount , toOpen } )
		Chest.applyTreasures( { user , treasures , context } )

		Object.entries( treasures ).forEach( ( [ item , quantity ] ) =>
			this.handleTreasure( item , quantity , user ) ,
		)

		this.processAfter( { user , treasures , context , openCount , toOpen } )

		return { treasures , openCount }
	}

	static procesBefore( { user , context , treasures , openCount , toOpen } ) {
		user.action( Actions.beforeOpenChest , {
			primary: context ,
			treasures ,
			openCount ,
			toOpen ,
		} )
	}

	static processAfter( { user , context , treasures , openCount , toOpen } ) {
		user.action( Actions.openChest , {
			primary: context ,
			treasures ,
			openCount ,
			toOpen ,
		} )
		user.action( Actions.globalQuest , { name: 'firstChest' } )
		addResource( {
			user ,
			value: -toOpen ,
			resource: PropertiesEnum.chestBonus ,
			source: 'chestManager.processAfter' ,
			executor: user ,
			context: { primary: context , openCount , treasures , toOpen } ,
		} )
		if ( userDataOf( user ).chestBonus === 0 ) {
			delete userDataOf( user ).chestBonus
		}
	}

	static processBirthday( { user , context } ) {
		const nowBirthday = userDataOf( user ).BDay === singletonBotData().dayDate
		if ( !nowBirthday ) {
			return
		}
		addResource( {
			user ,
			value: 30 ,
			resource: PropertiesEnum.chestBonus ,
			executor: user ,
			source: 'chestManager.processBirthday' ,
			context ,
		} )
	}
}

class Command extends BaseCommand {
	options = {
		name: 'chest' ,
		id: 32 ,
		media: {
			description: `\n\nЕжедневный-обычный сундук, ничем не примечательный...\nПожалуйста, не пытайтесь в него заглядывать 20 раз в сутки.\n\n❓ Может быть улучшен:\nУлучшение происходит через проведение ритуала в котле при достаточном количестве ресурса, Ключей.\nДля улучшения сундука до второго надо ${ KEYS_TO_UPGRADE_CHEST_TO_LEVEL_2 } ключей, и ${ KEYS_TO_UPGRADE_CHEST_TO_LEVEL_3 } до третьего.\n\n✏️\n\`\`\`python\n!chest #без аргументов\n\`\`\`\n\n` ,
		} ,
		alias: 'сундук daily скриня скринька' ,
		allowDM: true ,
		type: 'other' ,
	}

	async onChatInput( msg , interaction ) {
		const { user , userData } = interaction

		const cooldown = ChestManager.cooldown.for( userData )
		if ( cooldown.isOverloaded() ) {
			const diffContent = timestampToDate( cooldown.overload() )
			msg.msg( {
				title: `Сундук заперт, возвращайтесь позже!` ,
				color: '#ffda73' ,
				footer: {
					text: `До открытия: ${ diffContent }` ,
					iconURL:
						'https://vignette.wikia.nocookie.net/e2e-expert/images/b/b3/Chest.png/revision/latest?cb=20200108233859' ,
				} ,
			} )
			return
		}

		const chest = {
			icon: randomElementFromArray( [
				'https://cdn.discordapp.com/attachments/629546680840093696/778990528947027988/ezgif.com-gif-maker.gif' ,
				'https://cdn.discordapp.com/attachments/629546680840093696/778990564779229234/ezgif.com-gif-maker_1.gif' ,
			] ) ,
			color: '#ffda73' ,
		}

		const { treasures , openCount } = ChestManager.open( {
			user ,
			context: { interaction } ,
		} )

		let actualOpenCount = openCount
		const items = []

		const handleTreasure = ( item , quantity ) => {
			switch ( item ) {
			case 'trash':
				actualOpenCount -= quantity
				delete treasures.trash
				break

			case 'void':
				Object.assign( chest , {
					color: '#3d17a0' ,
					icon: 'https://media.discordapp.net/attachments/631093957115379733/842122055527694366/image-removebg-preview.png' ,
				} )
				items.push(
					`${ ending_with_normalize(
						quantity ,
						'Уров' ,
						'ней' ,
						'ень' ,
						'ня' ,
					) } нестабильности <a:void:768047066890895360>` ,
				)
				break

			case 'keys':
				items.push(
					`${ ending_with_normalize( quantity , 'Ключ' , 'ей' , '' , 'а' ) } 🔩` ,
				)
				break

			case 'coins':
				items.push(
					`${ ending_with_normalize(
						quantity ,
						'Коин' ,
						'ов' ,
						'' ,
						'а' ,
					) } <:coin:637533074879414272>` ,
				)
				break

			case 'exp':
				( () => {
					const emoji = [
						'<:crys:637290406958202880>' ,
						'<:crys2:763767958559391795>' ,
						'<:crys3:763767653571231804>' ,
					][ Math.min( 2 , Math.floor( quantity / 10 ) ) ]
					items.push(
						`${ ending_with_normalize( quantity , 'Опыт' , 'а' , '' , 'а' ) } ${ emoji }` ,
					)
				} )()
				break

			case 'berrys':
				items.push(
					`${ ending_with_normalize(
						quantity ,
						'Клубник' ,
						'' ,
						'а' ,
						'и' ,
					) } <:berry:756114492055617558>` ,
				)
				break

			case 'cake':
				items.push( 'Один Тортик 🎂' )
				break

			case 'bonus':
				items.push(
					`${ ending_with_normalize(
						quantity ,
						'Сокровищ' ,
						'' ,
						'е' ,
						'а' ,
					) } для этого сундука <a:chest:805405279326961684>` ,
				)
				break

			case 'thiefGloves':
				items.push(
					`${ ending_with_normalize( quantity , 'Перчат' , 'ок' , 'ка' , 'ки' ) } 🧤` ,
				)
				break

			case 'chilli':
				items.push(
					`${ ending_with_normalize( quantity , 'Пер' , 'цев' , 'ец' , 'ца' ) } 🌶️` ,
				)
				break

			default:
				break
			}
		}

		Object.entries( treasures ).forEach( ( [ item , quantity ] ) =>
			handleTreasure( item , quantity ) ,
		)

		const itemsOutput = structuredClone( items )
		cooldown.install()

		const embed = {
			title: actualOpenCount > 30 ? 'Невероятный сундук' : 'Ежедневный сундук' ,
			description: items.length
				? `БОНУСОВ СУНДУКА — ${ actualOpenCount }:`
				: 'Ежедневный сундук — пуст. Всего-лишь пара бесполезных крабьих ножек и горы песка... <a:penguin:780093060628873296>' ,
			color: chest.color ,
			thumbnail: !items.length ? chest.icon : null ,
			footer: { text: `Уровень сундука: ${ userData.chestLevel + 1 }` } ,
		}
		const message = await msg.msg( embed )
		embed.edit = true

		while ( itemsOutput.length ) {
			await sleep( 1500 / ( itemsOutput.length / 2 ) )
			embed.description += itemsOutput
				.splice( 0 , 1 )
				.map( e => `\n${ e }` )
				.join( '' )
			embed.thumbnail = itemsOutput.length ? null : chest.icon
			await message.msg( embed )
		}

		if ( items.length === 0 && randomWith( 2 ) === 0 ) {
			const curse = CurseManager.generate( {
				hard: null ,
				user: interaction.user ,
				context: { guild: interaction.guild , interaction } ,
			} )

			CurseManager.init( { user: interaction.user , curse } )
			await sleep( 3000 )
			msg.msg( {
				description: `${ interaction.user }, вы были прокляты. В пустом сундуке и не такое встречается.. 🪸` ,
			} )
		}
	}
}

export default Command
