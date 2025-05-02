import {
	KEYS_TO_UPGRADE_CHEST_TO_LEVEL_2 ,
	KEYS_TO_UPGRADE_CHEST_TO_LEVEL_3 ,
} from '#src/chest/constants.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { guildDataOf , singletonBotData , userDataOf } from '#src/data/singleton.js'
import { checkFilterPropertyFactory } from '#src/mini.js'
import { randomWith , sleep } from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import { addResource } from '#src/user/resources/addResource.js'
import { _WEIGHT_AUTO , randomElementFromArray , randomElementsFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'

class Command extends BaseCommand {
	bonusesBase = [
		{
			emoji: '🌀' ,
			id: 'cooldownDecrease' ,
			description: 'Уменьшает кулдаун получения опыта за сообщение на 0.2с' ,
			MAX_LEVEL: 20 ,
			MAX_WEIGHT: 100 ,
			_weight( user ) {
				const current = userDataOf( user ).voidCooldown || 0
				return (
					this.MAX_WEIGHT - ( current * ( this.MAX_WEIGHT / this.MAX_LEVEL ) || 0 )
				)
			} ,
			filter( user ) {
				const current = userDataOf( user ).voidCooldown || 0
				return current < this.MAX_LEVEL
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.cooldownDecrease' ,
					resource: PropertiesEnum.voidCooldown ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🔅' ,
			id: 'creatureBonuses' ,
			LIMIT: 2_000 ,
			BONUSES_PER_RITUAL: 18 ,
			BASIC: 120 ,
			MULTIPLAYER: 1.35 ,
			calculate( user ) {
				const value
					= ( userDataOf( user ).chestBonus * this.MULTIPLAYER || 0 )
						+ userDataOf( user ).voidRituals * this.BONUSES_PER_RITUAL
						+ this.BASIC
				return Math.min( Math.round( value ) , this.LIMIT )
			} ,
			description( user ) {
				return `Мгновенно получите бонус сундука в размере \`${ this.calculate(
					user ,
				) }\``
			} ,
			_weight: 40 ,
			action( user , interaction ) {
				const value = this.calculate( user )
				addResource( {
					user ,
					value ,
					executor: user ,
					source: 'command.witch.event.creatureBonuses' ,
					resource: PropertiesEnum.chestBonus ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '⚜️' ,
			id: 'decreaseWitchPrice' ,
			MAX_LEVEL: 3 ,
			description() {
				return `Уменьшает цену нестабильности для розжыга котла. (Макс. на ${
					this.MAX_LEVEL * 10
				}%)`
			} ,
			_weight: 5 ,
			filter( user ) {
				return ( userDataOf( user ).voidPrice || 0 ) < this.MAX_LEVEL
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.decreaseWitchPrice' ,
					resource: PropertiesEnum.voidPrice ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🃏' ,
			id: 'oddsToRestoreVoid' ,
			description:
				'Даёт 9%-й шанс не потерять уровни нестабильности во время ритуала.' ,
			_weight: 3 ,
			filter( user ) {
				return !userDataOf( user ).voidDouble
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.cooldownDecrease' ,
					resource: PropertiesEnum.voidDouble ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🔱' ,
			id: 'hardQuests' ,
			MAX_LEVEL: 5 ,
			description:
				'Делает ежедневные квесты на 15% сложнее, однако также увеличивает их награду на 30%' ,
			_weight: 5 ,
			filter( user ) {
				return ( userDataOf( user ).voidQuests || 0 ) < this.MAX_LEVEL
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.hardQuests' ,
					resource: PropertiesEnum.voidQuests ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '✨' ,
			id: 'starsCoinsMessages' ,
			BASIC: 20 ,
			BONUS_PER_RITUAL: 7 ,
			calculate( user ) {
				return Math.min(
					this.BASIC + userDataOf( user ).voidRituals * this.BONUS_PER_RITUAL ,
					300 ,
				)
			} ,
			description( user ) {
				const value = this.calculate( user )
				return `Увеличивает награду коин-сообщений на ${ value } ед.`
			} ,
			_weight: 35 ,
			action( user , interaction ) {
				const value = this.calculate( user )
				addResource( {
					user ,
					value ,
					source: 'command.witch.event.starsCoinsMessages' ,
					resource: PropertiesEnum.coinsPerMessage ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '💠' ,
			id: 'robTrasures' ,
			description:
				'Даёт \\*бонуы сундука* каждый раз, когда с помощью перчаток вам удается кого-то ограбить.' ,
			_weight: 20 ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.robTreasures' ,
					resource: PropertiesEnum.voidThief ,
					executor: user ,
					context: { interaction } ,
				} )
				return ( userDataOf( user ).voidThief = ++userDataOf( user ).voidThief || 1 )
			} ,
		} ,
		{
			emoji: '😈' ,
			id: 'smile' ,
			BASIC: 7 ,
			PER_RITUAL: 5 ,
			calculate( user ) {
				return (
					this.BASIC
					+ Math.floor( this.PER_RITUAL * userDataOf( user ).voidRituals ** 0.5 )
				)
			} ,
			description( user ) {
				return `Создайте экономических хаос, изменив стоимость клубники на рынке! ${ this.calculate(
					user ,
				) } коинов в случайную сторону.`
			} ,
			_weight: 12 ,
			action( user ) {
				return ( singletonBotData().berrysPrice
					+= this.calculate( user ) * ( -1 ) ** randomWith( 1 ) )
			} ,
		} ,
		{
			emoji: '🍵' ,
			id: 'updateCloverEffect' ,
			description: `На 12% усиливает для вас всякий бонус клевера\nНесколько бонусов складываются` ,
			_weight: 2 ,
			MAX_COUNT: 50 ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.updateCloverEffect' ,
					resource: PropertiesEnum.voidMysticClover ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
			filter( user ) {
				const current = userDataOf( user ).voidMysticClover || 0
				return current < this.MAX_COUNT
			} ,
		} ,
		{
			emoji: '📿' ,
			id: 'transformKeys' ,
			KEYS_PER_VOID: 120 ,
			calculate( user ) {
				const voids = Math.floor( userDataOf( user ).keys / this.KEYS_PER_VOID )
				const keys = userDataOf( user ).keys - ( userDataOf( user ).keys % this.KEYS_PER_VOID )
				return { voids , keys }
			} ,
			description( user ) {
				const { voids , keys } = this.calculate( user )
				return `Получите ${ voids } ур. нестабильности взамен ${ keys } ключей.`
			} ,
			_weight: 40 ,
			filter( user ) {
				return userDataOf( user ).keys >= this.KEYS_PER_VOID && userDataOf( user ).chestLevel
			} ,
			action( user , interaction ) {
				const { keys , voids } = this.calculate( user )
				addResource( {
					user ,
					value: -keys ,
					source: 'command.witch.event.transformKeys' ,
					resource: PropertiesEnum.keys ,
					executor: user ,
					context: { interaction } ,
				} )
				addResource( {
					user ,
					value: voids ,
					source: 'command.witch.event.transformKeys' ,
					resource: PropertiesEnum.void ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '♦️' ,
			id: 'luckyCoinOdds' ,
			MAX_LEVEL: 7 ,
			description: `Увеличивает вероятность коин-сообщения на 10%!` ,
			_weight: 15 ,
			filter( user ) {
				return userDataOf( user ).voidCoins < this.MAX_LEVEL
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.luckyCoinOdds' ,
					resource: PropertiesEnum.voidCoins ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🏵️' ,
			id: 'chestLevelIncrease' ,
			KEYS_FOR_FIRST_UPGRADE: KEYS_TO_UPGRADE_CHEST_TO_LEVEL_2 ,
			KEYS_FOR_SECOND_UPGRADE: KEYS_TO_UPGRADE_CHEST_TO_LEVEL_3 ,
			DESCRIPTION_VALUE_OFFSET: 2 ,
			getPrice( user ) {
				return userDataOf( user ).chestLevel
					? this.KEYS_FOR_SECOND_UPGRADE
					: this.KEYS_FOR_FIRST_UPGRADE
			} ,
			description( user ) {
				const price = this.getPrice( user )
				return `Улучшает сундук до ${
					userDataOf( user ).chestLevel + this.DESCRIPTION_VALUE_OFFSET
				} уровня. Требует ${ price } ключей.`
			} ,
			_weight: Infinity ,
			filter( user ) {
				return (
					userDataOf( user ).chestLevel !== 2 && userDataOf( user ).keys >= this.getPrice( user )
				)
			} ,
			action( user , interaction ) {
				const price = this.getPrice( user )
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.chestLevelIncrease' ,
					resource: PropertiesEnum.chestLevel ,
					executor: user ,
					context: { interaction } ,
				} )
				addResource( {
					user ,
					value: -price ,
					source: 'command.witch.event.chestLevelIncrease' ,
					resource: PropertiesEnum.keys ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '💖' ,
			id: 'strongMonsters' ,
			description: `Ваши монстры будут защищать вас от ограблений Воров` ,
			_weight: 3 ,
			filter( user ) {
				return userDataOf( user ).monster && !userDataOf( user ).voidMonster
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.strongMonsters' ,
					resource: PropertiesEnum.voidMonster ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '📕' ,
			id: 'treeFarm' ,
			description: `Вы можете брать на одну клубнику больше с дерева. Также при сборе повышает её цену на рынке` ,
			_weight: 20 ,
			filter( user ) {
				return 'seed' in userDataOf( user )
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.treeFarm' ,
					resource: PropertiesEnum.voidTreeFarm ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🥂' ,
			id: 'royaltyCasino' ,
			description: 'Лотерейный билетик из Лавки заменяется настоящим казино' ,
			_weight: 3 ,
			filter( user ) {
				return !userDataOf( user ).voidCasino
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.royaltyCasino' ,
					resource: PropertiesEnum.voidCasino ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🧵' ,
			id: 'tinThreadOfVoid' ,
			DECREASE_RITUALS_COUNT: 2 ,
			description( _user , interaction ) {
				return `Получите случайное количество нестабильности: 1–${
					interaction.minusVoids * 2
				}; Снижает уровень котла на ${
					this.DECREASE_RITUALS_COUNT
				}.\nЕсли Ваш уровень кратен двум, Вы получите одну дополнительную нестабильность.`
			} ,
			_weight: 15 ,
			filter( user ) {
				return userDataOf( user ).voidRituals > 4 && userDataOf( user ).voidRituals < 20
			} ,
			action( user , interaction ) {
				const voids
					= randomWith( 1 , interaction.minusVoids * 2 ) + !( userDataOf( user ).level % 2 )

				addResource( {
					user ,
					value: voids ,
					source: 'command.witch.event.tinThreadOfVoid' ,
					resource: PropertiesEnum.voidDouble ,
					executor: user ,
					context: { interaction } ,
				} )
				addResource( {
					user ,
					value: -( this.DECREASE_RITUALS_COUNT + 1 ) ,
					source: 'command.witch.event.tinThreadOfVoid' ,
					resource: PropertiesEnum.voidRituals ,
					executor: user ,
					context: { interaction } ,
				} )
			} ,
		} ,
		{
			emoji: '🪸' ,
			id: 'freedomCurse' ,
			description: `Позволяет иметь более одного проклятия` ,
			_weight: 40 ,
			filter( user ) {
				return userDataOf( user ).cursesEnded > 4 && !userDataOf( user ).voidFreedomCurse
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.freedomCurse' ,
					resource: PropertiesEnum.voidFreedomCurse ,
					executor: user ,
					context: { interaction } ,
				} )
				return ( userDataOf( user ).voidFreedomCurse = 1 )
			} ,
		} ,
		{
			emoji: '❄️' ,
			id: 'getVoidIce' ,
			// Хладнокровное одиночество
			description: `Вы получаете на 50% больше опыта и возможность грабить без рисков до момента, пока вас не похвалят, НО вас больше никто не сможет похвалить.` ,
			_weight: 1 ,
			filter( user ) {
				return (
					( !userDataOf( user ).voidIce && !userDataOf( user ).praiseMe )
					|| !userDataOf( user ).praiseMe.length
				)
			} ,
			action( user , interaction ) {
				addResource( {
					user ,
					value: 1 ,
					source: 'command.witch.event.getVoidIce' ,
					resource: PropertiesEnum.voidIce ,
					executor: user ,
					context: { interaction } ,
				} )
				user.action( Actions.globalQuest , { name: 'coolingSenses' } )
			} ,
		} ,
	]

	options = {
		name: 'witch' ,
		id: 48 ,
		media: {
			description:
				'Котелок даёт неплохие бонусы, а так же вводит концовку в боте — используя котёл 20 раз, вы раскроете её, попутно читая небольшой рассказ и уничтожив парочку вселенных.' ,
			example: `!witch #без аргументов` ,
		} ,
		accessibility: {
			publicized_on_level: 7 ,
		} ,
		alias: 'boiler котёл котел ведьма відьма' ,
		allowDM: true ,
		type: 'user' ,
	}

	async boilerChoise( { interaction , boiler } ) {
		const user = interaction.user

		const getWeight = bonus =>
			typeof bonus._weight === 'function'
				? bonus._weight( user , interaction )
				: bonus._weight

		const bonusesList = this.bonusesBase
			.filter( checkFilterPropertyFactory( user , interaction ) )
			.map( bonus => ( { ... bonus , _weight: getWeight( bonus ) } ) )

		const bonuses = randomElementsFromArray( bonusesList , 3 , {
			associatedWeights: _WEIGHT_AUTO ,
		} )

		const getDescription = bonus =>
			typeof bonus.description === 'function'
				? bonus.description( user , interaction )
				: bonus.description
		const bonusesDescriptionContent = bonuses
			.map( bonus => `${ bonus.emoji }${ getDescription( bonus ) }` )
			.join( '\n\n' )

		await boiler.msg( {
			title:
				'<a:placeForVoid:780051490357641226> Выберите второстепенный бонус' ,
			description: `Вы можете выбрать всего одно сокровище, хорошенько подумайте, прежде чем что-то взять.\n${ bonusesDescriptionContent }` ,
			edit: true ,
			color: '#3d17a0' ,
		} )

		const react
			= ( await boiler.awaitReact(
				{ user: interaction.user , removeType: 'all' } ,
				... bonuses.map( bonus => bonus.emoji ) ,
			) ) || randomElementFromArray( bonuses ).emoji

		bonuses.find( bonus => bonus.emoji === react ).action( user , interaction )

		boiler.msg( {
			title: 'Ритуал завершен...' ,
			description: `Вы выбрали ${ react }\nОстальные бонусы более недоступны.\n\n${ bonusesDescriptionContent }` ,
			color: '#3d17a0' ,
			edit: true ,
		} )
	}

	calculateExperienceBonus( userData ) {
		return Math.max( 0.97716 ** userData.voidRituals , 0.625 )
	}

	calculateRitualPrice( userData , guildData ) {
		const treeLevelBonus = Math.floor( ( guildData.tree.level ?? 0 ) / 10 )

		const basic = Math.min( 2 + userData.voidRituals , 20 ) - treeLevelBonus
		const multiplayer = 1 - 0.1 * ( userData.voidPrice || 0 )
		return Math.floor( basic * multiplayer )
	}

	displayStory( interaction ) {
		let storyContent = ''
		const add = content => ( storyContent = `${ content }\n${ storyContent }` )
		const user = interaction.user

		switch ( userDataOf( user ).voidRituals ) {
		case 23:
			add( 'Мы не знаем что произошло дальше. . .' )
			break

		case 22:
			add( '...' )
			break

		case 19:
			user.action( Actions.globalQuest , { name: 'completeTheGame' } )
			add(
				'Но должен ли я остановится? Вселенных, как известно, бесчисленное множество, бесконечность... Поглощая самого себя снова, и снова, мне, возможно, удастся получить ответ. А с приобретенной силой я создам идеальный мир..!' ,
			)
			add(
				'— Получается я убил их, уничтожил целые вселенные, миры.. Каждый раз я попадая в новую вселенную, заменял собою себя, уничтожая минувший мир. Неужели этого нельзя исправить.. Неужели это конец?' ,
			)

		case 18:

		case 17:
			add( '' )
			add(
				'— С каждым днем я ощущаю большую силу, начинаю задумываться о вещах, о которых раньше и слышать не смел. Меня посещают странные мысли, но больше всего меня беспокоит отсутствие беспокойства.' ,
			)

		case 16:
			add( '' )
			add(
				'— Прошло не мало времени с последнего ритуала, я всё так же пытаюсь понять что случилось, некоторые мои знакомые стали считать меня сумаcшедшим. Странно, что никто и никогда не видел никаких вспышек в небе, как их можно не заметить? Никак.' ,
			)

		case 15:
			add( '' )
			add(
				'Может я сошёл с ума, или я умер, а то что я чувствую это остатки моей самости, её последние воспоминания, которые я вновь и вновь бесконечно чувствую?.. Я не знаю' ,
			)
			add(
				'Нет, это не мог быть сон! Снова вспоминая каждый огонёк, каждую "трещину", рождающуюся в небе, и всё то, странное, что тогда было...' ,
			)

		case 14:

		case 13:

		case 12:

		case 11:

		case 10:
			add(
				'Размышление о происходящем весь день не покидали вас, чувство беспокойства не позволяло думать о другом.. Мыслями вы снова, и снова возвращаетесь туда, где всё только начиналось.' ,
			)

		case 9:

		case 8:

		case 7:

		case 6:

		case 5:
			add(
				'Даже ваша собака может подтвердить, что вчера весь день вы были в своей кровати и играли в видео-игры. Как и ваш друг, который тогда выносил вас в танчиках, скажет то же, что и пёс.' ,
			)

		case 4:
			add(
				'Нет, это не мог быть сон, вспоминая каждый летающий в черном небе огонёк, думаете вы. Но факты говорят обратное..' ,
			)

		case 3:

		case 2:
			add( '' )
			add( 'Всё было такое яркое и красочное..' )

		case 1:
			add(
				'Впереди стояла необъяснимо-необъяснимая дверь, за которой виднелась ваша комната. Войдя, вы просыпаетесь на своей кровати, вокруг всё как раньше. Ощущаете себя, как никогда хорошо, но с помутнённым разумом.' ,
			)
			add(
				'*Яркая вспышка котла что-то изменила в этом мире, он начал разрушаться.*' ,
			)
			break

		default:
			add( '...' )
		}
		const title = `День ${ Math.round( userDataOf( user ).voidRituals ** 2.093 / 1.3 ) }.`
		interaction.channel.msg( {
			title ,
			description: storyContent ,
			image:
				userDataOf( user ).voidRituals === 19
					? 'https://media.discordapp.net/attachments/629546680840093696/843562906053640202/2.jpg?width=1214&height=683'
					: 'https://media.discordapp.net/attachments/629546680840093696/836122708185317406/mid_250722_922018.jpg' ,
			footer: {
				iconURL: interaction.user.avatarURL() ,
				text: interaction.user.username ,
			} ,
			color: '#000001' ,
		} )
	}

	displayVoidNotEnought( { interaction , userData , reference = null } ) {
		const description = `Добудьте ещё ${ ending(
			interaction.minusVoids - userData.void ,
			'уров' ,
			'ней' ,
			'ень' ,
			'ня' ,
		) } нестабильности <a:placeForVoid:780051490357641226>\nЧтобы провести ритуал нужно ${ ending(
			interaction.minusVoids ,
			'камн' ,
			'ей' ,
			'ь' ,
			'я' ,
		) }, а у вас лишь ${
			userData.void
		};\nИх можно получить, с низким шансом, открывая ежедневный сундук.\nПроведено ритуалов: ${
			userData.voidRituals
		}\nКотёл даёт полезные бонусы, а также увеличивает количество опыта.`
		const footer = {
			text: randomElementFromArray( [
				'Интересно, куда делись все ведьмы?' ,
				'Правило по использованию номер 5:\nНИКОГДА не используйте это.*' ,
				'Неприятности — лучшие друзья странных светящихся котов.' ,
				'Берегитесь мяукающих созданий.' ,
			] ) ,
		}
		interaction.channel.msg( {
			title: '<a:void:768047066890895360> Не хватает ресурса' ,
			description ,
			color: '#3d17a0' ,
			footer ,
			reference ,
		} )
	}

	getContext( interaction ) {
		return { interaction }
	}

	async onChatInput( msg , interaction ) {
		// <a:void:768047066890895360> <a:placeForVoid:780051490357641226> <a:cotik:768047054772502538>

		if ( this.process_displayMemberBoiler( interaction ) ) {
			return
		}

		const userData = interaction.userData
		interaction.minusVoids = this.calculateRitualPrice(
			userData ,
			guildDataOf( interaction.guild ) ,
		)

		if ( userData.void < interaction.minusVoids ) {
			this.displayVoidNotEnought( { userData , interaction } )
			return
		}

		const boilerMessage = await msg.msg( {
			title:
				'<a:placeForVoid:780051490357641226> Готовы ли вы отдать свои уровни за вечные усиления..?' ,
			description: `Потратьте ${
				interaction.minusVoids
			} ур. нестабильности, чтобы стать быстрее, сильнее и хитрее.\n~ Повышает заработок опыта на 2%\nПроведено ритуалов: ${
				userData.voidRituals
			}\nБонус к опыту: ${ (
				100
				* ( 1 - this.calculateExperienceBonus( userData ) + 1 )
			).toFixed(
				2 ,
			) }%\n\nКроме того, вы сможете выбрать одно из трёх сокровищ, дарующих вам неймоверную мощь!\n<a:cotik:768047054772502538>` ,
			color: '#3d17a0' ,
		} )
		const isHePay = await boilerMessage.awaitReact(
			{ user: interaction.user , removeType: 'all' } ,
			'768047066890895360' ,
		)

		if ( !isHePay ) {
			boilerMessage.msg( {
				title: 'Возвращайтесь, когда будете готовы.' ,
				description: 'Проведение ритуала было отменено' ,
				edit: true ,
				color: '#3d17a0' ,
			} )
			return
		}

		if ( userData.void < interaction.minusVoids ) {
			this.displayVoidNotEnought( {
				userData ,
				interaction ,
				reference: boilerMessage.id ,
			} )
			boilerMessage.delete()
			return
		}

		await sleep( 1000 )

		// Вы не потеряете нестабильность
		if ( userData.voidDouble && randomWith( 11 ) === 1 ) {
			interaction.minusVoids = 0
		}

		addResource( {
			user: interaction.user ,
			value: -interaction.minusVoids ,
			source: 'command.witch.ritual' ,
			resource: PropertiesEnum.void ,
			executor: interaction.user ,
			context: { interaction } ,
		} )

		addResource( {
			user: interaction.user ,
			value: 1 ,
			source: 'command.witch.ritual' ,
			resource: PropertiesEnum.voidRituals ,
			executor: interaction.user ,
			context: { interaction } ,
		} )

		await this.boilerChoise( { userData , interaction , boiler: boilerMessage } )
		await interaction.channel.sendTyping()
		await sleep( 3000 )
		this.displayStory( interaction )
	}

	process_displayMemberBoiler( interaction ) {
		if ( !interaction.mention ) {
			return false
		}
		const userData = interaction.mention.data
		interaction.channel.msg( {
			title:
				'<a:cotik:768047054772502538> Друг странного светящегося кота — мой друг' ,
			description: `Сегодня Вы просматриваете профиль другого человека. Законно ли это? Конечно законно, он не против.\n${
				userData.name
			}, использовал котёл ${ userData.voidRituals } раз.\nЕго бонус к опыту: ${ (
				100
				* ( 1 / this.calculateExperienceBonus( userData ) )
			).toFixed(
				2 ,
			) }% от котла.\n<a:placeForVoid:780051490357641226>\n\nСъешь ещё этих французких булок, да выпей чаю` ,
			color: '#3d17a0' ,
		} )
		return true
	}
}

export default Command
