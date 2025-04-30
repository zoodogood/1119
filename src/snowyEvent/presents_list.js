import { SECOND } from '#constants/time.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { addResource } from '#src/user/resources/addResource.js'
import { Emoji } from '#src/emojis/emojis.js'
import { transformToCollectionUsingKey } from '#src/nodejs/Collection/transformToCollectionUsingKey.js'
import { sleep } from '#src/safe-utils.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'

export function getPresentsList() {
	return transformToCollectionUsingKey( [
		{
			weights: 5 ,
			key: 'lollipop' ,
			async callback( context ) {
				const { user } = context
				const { addResourceAndMoveToBag } = await import(
					'#src/bag/command.bag.js'
				)
				addResourceAndMoveToBag( {
					resource: PropertiesEnum.lollipops ,
					user ,
					context ,
					executor: user ,
					value: 1 ,
					source: 'curseManager.events.happySnowy.presents.lollipop' ,
				} )
			} ,
			emoji: Emoji.lollipops ,
			description:
				'Леденец. Используйте леденец в сумке !bag use lollipop, чтобы призвать босса на сервер' ,
		} ,
		{
			weights: 15 ,
			key: 'snowyTree' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.snowyTree ,
					user ,
					context ,
					executor: user ,
					value: 1 ,
					source: 'curseManager.events.happySnowy.presents.snowyTree' ,
				} )
			} ,
			emoji: Emoji.snowyTree ,
			description:
				'Символ дерево - эмблема. Этот редкий предмет останется с вами ещё надолго' ,
		} ,
		{
			weights: 5 ,
			key: 'presentsPack' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.presents ,
					user ,
					context ,
					executor: user ,
					value: 3 ,
					source: 'curseManager.events.happySnowy.presents.presentsPack' ,
				} )
			} ,
			emoji: Emoji.presentsPack ,
			description: 'Коробка подарков. Уже распаковано — три подарка получено' ,
		} ,
		{
			weights: 15 ,
			key: 'bonuses' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.chestBonus ,
					user ,
					context ,
					executor: user ,
					value: 90 ,
					source: 'curseManager.events.happySnowy.presents.bonuses' ,
				} )
			} ,
			emoji: Emoji.chestBonus ,
			description: '90 сундуков. В подарке было 90 сундуков' ,
		} ,
		{
			weights: 20 ,
			key: 'multiVoid' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.void ,
					user ,
					context ,
					executor: user ,
					value: 3 ,
					source: 'curseManager.events.happySnowy.presents.multiVoid' ,
				} )
			} ,
			emoji: Emoji.void ,
			description: '3 нестабильности. В подарке было 3 нестабильности' ,
		} ,
		{
			weights: 10 ,
			key: 'snowyQuote' ,
			async callback( context ) {
				context.provideComponents(
					justButtonComponents( {
						label: 'Читать' ,
					} ) ,
				)

				context.onComponent = async ( interaction ) => {
					const { getNewYearQuote } = await import(
						'#src/snowyEvent/getNewYearQuote.js'
					)
					await sleep( SECOND )
					interaction.msg( {
						description: getNewYearQuote() ,
						footer: {
							text: 'Большинство цитат взяты отсюда: https://citaty.info/topic/novyi-god, они так же могут быть получены по API' ,
						} ,
					} )

					context.componentsCollector.stop()
				}
			} ,
			emoji: Emoji.plain_scroll ,
			description:
				'Новогодняя цитата. Бот хочет отправить вам одну из доступных цитат' ,
		} ,
		{
			weights: 20 ,
			key: 'coins' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.coins ,
					user ,
					context ,
					executor: user ,
					value: 9_000 ,
					source: 'curseManager.events.happySnowy.presents.coins' ,
				} )
			} ,
			emoji: Emoji.coins ,
			description: '9 000 коинов. В подарке 9 000 коинов' ,
		} ,
		{
			weights: 10 ,
			key: 'oneVoid' ,
			callback( context ) {
				const { user } = context
				addResource( {
					resource: PropertiesEnum.void ,
					user ,
					context ,
					executor: user ,
					value: 1 ,
					source: 'curseManager.events.happySnowy.presents.oneVoid' ,
				} )
			} ,
			emoji: Emoji.void ,
			description: 'Нестабильность. Получите нестабильность!' ,
		} ,
	] )
}
