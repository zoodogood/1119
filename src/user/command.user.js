import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import { client } from '#src/bot/client/singleton.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'

import { takeInteractionProperties } from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { EXPERIENCE_PER_LEVEL } from '#src/level/constants.js'
import QuestManager from '#src/quests/QuestManager.js'
import {
	NumberFormatLetterize ,
	sleep ,
	timestampToDate ,
} from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import Template from '#src/VirtualMachine/Template.js'
import { ending } from '@zoodogood/utils/primitives'
import { PresenceUpdateStatus } from 'discord.js'

class Command extends BaseCommand {
	options = {
		name: 'user' ,
		id: 3 ,
		media: {
			description:
				'Отображает профиль пользователя — ежедневный квест, количество коинов, уровень, содержимое инвентаря и тому подобное.' ,
			example: `!user <memb>` ,
		} ,
		alias: 'юзер u ю profile профиль користувач' ,
		allowDM: true ,
		cooldown: 20_000 ,
		cooldownTry: 3 ,
		type: 'user' ,
	}

	async onChatInput( msg , interaction ) {
		const target = interaction.params
			? ( interaction.mention
				?? client.users.cache.get( interaction.params )
				?? msg.author )
			: msg.author
		const member = msg.guild ? msg.guild.members.resolve( target ) : null
		const user = target.data
		const guild = msg.guild

		target.action( Actions.curseBeforeProgressDisplay , {} )
		target.action( Actions.beforeProfileDisplay , interaction )

		Object.assign( interaction , {
			currentCurseView: 0 ,

			rank: {
				position: null ,
				members: guild
					? guild.members.cache
						.map( m => m.user )
						.filter( user => !user.bot )
						.filter( user => user.data.level > 1 )
					: null ,
			} ,

			status: null ,
			embedColor: user.profile_color || 'Random' ,
			controller: {
				message: null ,
				editEmbed: false ,
				reactions: [ '640449832799961088' ] ,
			} ,
		} )

		if ( guild && member === undefined ) {
			msg.msg( {
				title: 'На сервере нет упомянутого пользователя' ,
				color: '#ff0000' ,
				delete: 9000 ,
			} )
			return
		}

		if ( member && user.level > 1 ) {
			interaction.rank.position
				= interaction.rank.members
					.sort( ( b , a ) =>
						a.data.level !== b.data.level
							? a.data.level - b.data.level
							: a.data.exp - b.data.exp ,
					)
					.indexOf( target ) + 1
		}

		if (
			( member?.presence
				&& member.presence.status !== PresenceUpdateStatus.Offline )
			|| target === msg.author
		) {
			interaction.status = '<:online:637544335037956096> В сети'
		} else {
			const lastOnline = Date.now() - ( user.last_online ?? 0 )
			const getDateContent = () =>
				lastOnline > 31556926000000
					? 'более года'
					: lastOnline > 2629743000
						? 'более месяца'
						: timestampToDate( lastOnline )
			const dateContent = user.profile_confidentiality ? '' : getDateContent()
			interaction.status = `<:offline:637544283737686027> Не в сети ${ dateContent }`
		}

		QuestManager.checkAvailable( { user: target } )
		CurseManager.checkAvailableAll( target )

		const createEmbedAtFirstPage = async () => {
			const description = `Коинов: **${ NumberFormatLetterize(
				user.coins ,
			) }**<:coin:637533074879414272> \n <a:crystal:637290417360076822>Уровень: **${
				user.level || 1
			}** \n <:crys:637290406958202880>Опыт: **${ user.exp || 0 }/${
				( user.level || 1 ) * EXPERIENCE_PER_LEVEL
			}**\n\n ${ interaction.status }\n`

			const embed = {
				title: 'Профиль пользователя' ,
				author: {
					name: `#${ target.username }` ,
					iconURL: target.avatarURL( { dynamic: true } ) ,
				} ,
				color: interaction.embedColor ,
				edit: interaction.controller.editEmbed ,
				description ,
				fields: [ { name: ' ᠌' , value: ' ᠌' } ] ,
				footer: {
					text: `Похвал: ${ user.praiseMe?.length || '0' }   ${
						interaction.rank
							? `Ранг: ${
								interaction.rank.position
									? `${ interaction.rank.position ?? 0 }/${
										interaction.rank.members.length
									}`
									: 'Недоступно'
							}`
							: ''
					}` ,
				} ,
			}

			if ( user.profile_description ) {
				const source = {
					empowered: interaction.user ,
					type: Template.sourceTypes.involuntarily ,
				}
				const about = await new Template(
					source ,
					new BaseContext( 'command.user' , {
						executor: interaction.user ,
						... takeInteractionProperties( interaction ) ,
						primary: interaction ,
					} ) ,
				).replaceAll( user.profile_description , msg )
				embed.fields.push( { name: 'О пользователе: ᠌' , value: about } )
			}

			if ( member ) {
				const secretAchievements = QuestManager.questsBase
					.filter(
						questBase =>
							questBase.isGlobal && questBase.isSecret && !questBase.isRemoved ,
					)
					.filter( questBase =>
						user.questsGlobalCompleted?.includes( questBase.id ) ,
					)

				const achievementContent = secretAchievements.size
					? `${ secretAchievements.random().emoji } `
					: ''
				embed.fields.push( {
					name: ' ᠌᠌' ,
					value: '\n**' + `${ achievementContent }${ member.roles.highest }**\nᅠ` ,
				} )
			}

			if ( !target.bot ) {
				const quest = user.quest
				const questBase = QuestManager.questsBase.get( quest.id )
				const value = quest.isCompleted
					? ' – Квест выполнен'
					: `${ questBase.description } ${ quest.progress }/${ quest.goal }`
				embed.fields.push( { name: '\nКвест:' , value } )
			}

			if ( user.curses?.length ) {
				const { Utils } = await import( '#src/curses/command.curses.js' )
				const content = Utils.getCursesProgressContent( user.curses )
				embed.fields.push( {
					name: '᠌᠌' ,
					value: `Прогресс проклятия: ${ content }` ,
				} )
			}

			return embed
		}

		const createEmbedAtSecondPage = async () => {
			const footer = member
				? {
					text: `На сервере с ${ new Intl.DateTimeFormat( 'ru-ru' , {
						day: 'numeric' ,
						year: 'numeric' ,
						month: 'long' ,
					} ).format( member.joinedTimestamp ) }` ,
				}
				: null

			const embed = {
				title: `Статистика ${
					member ? member.displayName : ( target.globalName ?? target.username )
				}` ,
				color: interaction.embedColor ,
				footer ,
				edit: interaction.controller.editEmbed ,
			}

			const contents = []
			const inventory = [
				`🔩${ user.keys }` ,
				`<a:void:768047066890895360>${ user.void }` ,
				`🧤${
					user.thiefGloves ? `${ user.thiefGloves }|${ user.thiefCombo || 0 }` : 0
				}|${ user.thiefWins ? String( user.thiefWins ).replace( '-' , '!' ) : '0' }` ,
				`${ user.chilli ? `🌶️${ user.chilli }` : '' }` ,
				`${ user.monster ? `🐲${ user.monster }` : '' }` ,
				`${ user.seed ? `🌱${ user.seed }` : '' }` ,
				`${ user.snowyTree ? `${ Emoji.snowyTree }${ user.snowyTree }` : '' }` ,
				`${ user.lollipops ? `${ Emoji.lollipops }${ user.lollipops }` : '' }` ,
				`${ user.presents ? `🎁${ user.presents }` : '' }` ,
				`${ user.cheese ? `🧀${ user.cheese }` : '' }` ,
			]

			if ( user.element ) {
				const emoji = [ '🍃 Земля' , '☁️ Воздух' , '🔥 Огонь' , '👾 Тьма' ][
					user.element
				]
				const content = `\n${ emoji } — элемент ${
					( user.elementLevel ?? 0 ) + 1
				} ур.\n`
				contents.element = content
			}

			const fields = [
				{
					name: 'Клубники <:berry:756114492055617558>' ,
					value: `Имеется: ${ user.berrys }` ,
					inline: true ,
				} ,
				{
					name: `Сундук ${
						user.CD_32 > Date.now()
							? '<:chest_opened:986165753843679232>'
							: '<a:chest:805405279326961684>'
					}` ,
					value: `Сундук ур.: ${ user.chestLevel + 1 }\nБонус след. открытия: \`${
						user.chestBonus || 0
					}\`` ,
					inline: true ,
				} ,
				{
					name: 'Содержимое сумки' ,
					value: `${ inventory.join( '  ' ) }${ contents.element ?? '' }\n⠀` ,
					inline: false ,
				} ,
				{
					name: 'Выполнено квестов 📜' ,
					value: ( () => {
						const userCompleted = ( user.questsGlobalCompleted ?? '' )
							.split( ' ' )
							.filter( Boolean )
						const isSimpleGlobalQuest = questBase =>
							questBase.isGlobal && !questBase.isSecret && !questBase.isRemoved

						const bases = QuestManager.questsBase.filter(
							quest =>
								userCompleted.includes( quest.id ) || isSimpleGlobalQuest( quest ) ,
						)
						const globalsContent = `Глобальных: ${ userCompleted.length }/${ bases.size }`
						const dailyQuestsContent = `Ежедневных: ${
							target.bot ? 'BOT' : user.dayQuests || 0
						}`
						return `${ dailyQuestsContent }\n${ globalsContent }`
					} )() ,
					inline: false ,
				} ,
				{
					name: 'Проклятия 💀' ,
					value: ( () => {
						const surviveContent = `Пережито проклятий: ${
							user.cursesEnded || 0
						}`
						const getCurrentContent = () => {
							if ( !user.curses?.length ) {
								return 'Проклятия отсуствуют.'
							}

							const count = ending(
								user.curses.length ,
								'' ,
								`Текущие проклятия (их ${ user.curses.length })` ,
								'Текущее проклятие' ,
								'Текущие два проклятия' ,
								{ unite: ( _quantity , word ) => word } ,
							)
							const curse = user.curses.at( interaction.currentCurseView )
							if ( !curse ) {
								return 'Проклятия отсуствуют.'
							}
							const description = CurseManager.interface( {
								user: target ,
								curse ,
							} ).toString()
							return `>>> ${ count }:\n${ description }`
						}
						return `${ surviveContent }\n${ getCurrentContent() }`
					} )() ,
					inline: false ,
					filter: () => user.cursesEnded || user.curses ,
				} ,
				{
					name: 'Бонусы котла <a:placeForVoid:780051490357641226>' ,
					value: `\`\`\`Уменьшений кулдауна: ${ ~~user.voidCooldown }/20\nСкидок на котёл: ${ ~~user.voidPrice }/3\nНестабилити: ${ ~~user.voidDouble }/1\nУсиление квестов: ${ ~~user.voidQuests }/5\nШанс коина: ${ ~~user.voidCoins }/7 (${ +(
						( 1 / ( 85 * 0.9 ** user.voidCoins ) )
						* 100
					).toFixed(
						2 ,
					) }%)\nМонстр-защитник: ${ ~~user.voidMonster }/1\nКазино: ${ ~~user.voidCasino }/1\nСвобода проклятий: ${ ~~user.voidFreedomCurse }/1\nБонусы от перчаток: ${ ~~user.voidThief }\nУмение заворож. Клевер: ${
						user.voidMysticClover ?? 0
					}/50\nФермер: ${ user.voidTreeFarm ?? 0 }\nНаграда коин-сообщений: ${
						35 + ( user.coinsPerMessage || 0 )
					}\`\`\`` ,
					inline: false ,
				} ,
			]

			embed.fields = fields.filter( field => !field.filter || field.filter() )
			return embed
		}

		const controller = interaction.controller
		controller.message = await msg.msg( await createEmbedAtFirstPage() )
		controller.editEmbed = true

		while ( true ) {
			sleep( 8500 )

			const react = await controller.message.awaitReact(
				{ user: 'any' , removeType: 'all' , time: 20000 } ,
				... controller.reactions ,
			)
			target.action( Actions.curseBeforeProgressDisplay , {} )

			switch ( react ) {
			case '640449848050712587':
				interaction.currentCurseView
						= ( interaction.currentCurseView + 1 ) % ( user.curses?.length || 1 )
				await controller.message.msg( await createEmbedAtFirstPage() )
				controller.reactions = [ '640449832799961088' ]
				break

			case '640449832799961088':
				await controller.message.msg( await createEmbedAtSecondPage() )
				controller.reactions = [ '640449848050712587' ]
				break

			default:
				return
			}
		}
	}
}

export default Command
