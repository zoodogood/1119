import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import { client } from '#src/bot/client/singleton.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'

import { takeInteractionProperties } from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { EXPERIENCE_PER_LEVEL } from '#src/level/constants.js'
import QuestManager , { isSimpleGlobalQuest } from '#src/quests/QuestManager.js'
import {
	maybe_multiline ,
	NumberFormatLetterize ,
	sleep ,
	timestampToDate ,
} from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import Template from '#src/VirtualMachine/Template.js'
import { ending } from '@zoodogood/utils/primitives'
import { PresenceUpdateStatus } from 'discord.js'
import { MONTH , SECOND , YEAR } from '../constants/time.js'
import { getCursesProgressContent } from '../curses/text_templates.js'
import { userDataOf } from '../data/singleton.js'
import { percent_string } from '../formatters/formatters.js'

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
		cooldown: 20 * SECOND ,
		cooldownTry: 3 ,
		type: 'user' ,
	}

	async onChatInput( msg , interaction ) {
		const target = interaction.mention
			?? client.users.cache.get( interaction.params )
			?? interaction.user
		const { guild } = interaction
		const member = guild ? guild.members.resolve( target ) : null
		const userData = userDataOf( target )

		target.action( Actions.curseBeforeProgressDisplay , {} )
		target.action( Actions.beforeProfileDisplay , interaction )

		Object.assign( interaction , {
			currentCurseView: 0 ,

			rank: member && userData.level > 1 && {
				position: null ,
				members: guild.members.cache
					.map( m => m.user )
					.filter( user => !user.bot )
					.filter( user => userDataOf( user ).level > 1 ) ,
			} ,

			status: null ,
			embedColor: userData.profile_color || 'Random' ,
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
				delete: 9 * SECOND ,
			} )
			return
		}

		if ( interaction.rank ) {
			interaction.rank.position
				= interaction.rank.members
					.sort( ( b , a ) =>
						userDataOf( a ).level - userDataOf( b ).level || userDataOf( a ).exp - userDataOf( b ).exp ,
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
			const lastOnline = Date.now() - ( userData.last_online ?? 0 )
			const getDateContent = () =>
				lastOnline > YEAR
					? 'более года'
					: lastOnline > MONTH
						? 'более месяца'
						: timestampToDate( lastOnline )
			const dateContent = userData.profile_confidentiality ? '' : getDateContent()
			interaction.status = `<:offline:637544283737686027> Не в сети ${ dateContent }`
		}

		QuestManager.checkAvailable( { user: target } )
		CurseManager.checkAvailableAll( target )

		const createEmbedAtFirstPage = async () => {
			const description = maybe_multiline( [
				`Коинов: **${ NumberFormatLetterize(
					userData.coins ,
				) }**<:coin:637533074879414272> \n` ,
				`<a:crystal:637290417360076822>Уровень: **${
					userData.level || 1
				}** \n` ,
				`<:crys:637290406958202880>Опыт: **${ userData.exp || 0 }/${
					( userData.level || 1 ) * EXPERIENCE_PER_LEVEL
				}**\n\n` ,
				`${ interaction.status }\n` ,
			] )

			const fields = [
				{ name: ' ᠌' , value: ' ᠌' } ,
				userData.profile_description && await ( async () => {
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
					).replaceAll( userData.profile_description , msg )
					return { name: 'О пользователе: ᠌' , value: about }
				} )() ,
				( member ) && ( () => {
					const secretAchievements = QuestManager.questsBase
						.filter(
							questBase =>
								questBase.isGlobal && questBase.isSecret && !questBase.isRemoved ,
						)
						.filter( questBase =>
							userData.questsGlobalCompleted?.includes( questBase.id ) ,
						)

					const achievementContent = secretAchievements.size
						? `${ secretAchievements.random().emoji } `
						: ''
					return {
						name: ' ᠌᠌' ,
						value: '\n**' + `${ achievementContent }${ member.roles.highest }**\nᅠ` ,
					}
				} )() ,
				( !target.bot ) && ( () => {
					const quest = userData.quest
					const questBase = QuestManager.questsBase.get( quest.id )
					const value = quest.isCompleted
						? ' – Квест выполнен'
						: `${ questBase.description } ${ quest.progress }/${ quest.goal }`
					return { name: '\nКвест:' , value }
				} )() ,
				( userData.curses?.length ) && {
					name: '᠌᠌' ,
					value: `Прогресс проклятия: ${ getCursesProgressContent( userData.curses ) }` ,
				} ,
			].filter( Boolean )

			return {
				title: 'Профиль пользователя' ,
				author: {
					name: `#${ target.username }` ,
					iconURL: target.avatarURL( { dynamic: true } ) ,
				} ,
				color: interaction.embedColor ,
				edit: interaction.controller.editEmbed ,
				description ,
				fields ,
				footer: {
					text: `Похвал: ${ userData.praiseMe?.length || '0' }   ${
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

			const contents = []
			const inventory = [
				`🔩${ userData.keys }` ,
				`<a:void:768047066890895360>${ userData.void }` ,
				`🧤${
					userData.thiefGloves ? `${ userData.thiefGloves }|${ userData.thiefCombo || 0 }` : 0
				}|${ userData.thiefWins ? String( userData.thiefWins ).replace( '-' , '!' ) : '0' }` ,
				`${ userData.chilli ? `🌶️${ userData.chilli }` : '' }` ,
				`${ userData.monster ? `🐲${ userData.monster }` : '' }` ,
				`${ userData.seed ? `🌱${ userData.seed }` : '' }` ,
				`${ userData.snowyTree ? `${ Emoji.snowyTree }${ userData.snowyTree }` : '' }` ,
				`${ userData.lollipops ? `${ Emoji.lollipops }${ userData.lollipops }` : '' }` ,
				`${ userData.presents ? `🎁${ userData.presents }` : '' }` ,
				`${ userData.cheese ? `🧀${ userData.cheese }` : '' }` ,
			]

			if ( userData.element ) {
				const emoji = [ '🍃 Земля' , '☁️ Воздух' , '🔥 Огонь' , '👾 Тьма' ][
					userData.element
				]
				const content = `\n${ emoji } — элемент ${
					( userData.elementLevel ?? 0 ) + 1
				} ур.\n`
				contents.element = content
			}

			const fields = [
				{
					name: 'Клубники <:berry:756114492055617558>' ,
					value: `Имеется: ${ userData.berrys }` ,
					inline: true ,
				} ,
				{
					name: `Сундук ${
						userData.CD_32 > Date.now()
							? '<:chest_opened:986165753843679232>'
							: '<a:chest:805405279326961684>'
					}` ,
					value: `Сундук ур.: ${ userData.chestLevel + 1 }\nБонус след. открытия: \`${
						userData.chestBonus || 0
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
						const userCompleted = ( userData.questsGlobalCompleted ?? '' )
							.split( ' ' )
							.filter( Boolean )

						const bases = QuestManager.questsBase.filter(
							quest =>
								userCompleted.includes( quest.id ) || isSimpleGlobalQuest( quest ) ,
						)
						const globalsContent = `Глобальных: ${ userCompleted.length }/${ bases.size }`
						const dailyQuestsContent = `Ежедневных: ${
							target.bot ? 'BOT' : userData.dayQuests || 0
						}`
						return `${ dailyQuestsContent }\n${ globalsContent }`
					} )() ,
					inline: false ,
				} ,
				{
					name: 'Проклятия 💀' ,
					value: ( () => {
						const surviveContent = `Пережито проклятий: ${
							userData.cursesEnded || 0
						}`
						const getCurrentContent = () => {
							if ( !userData.curses?.length ) {
								return 'Проклятия отсуствуют.'
							}

							const count = ending(
								userData.curses.length ,
								'' ,
								`Текущие проклятия (их ${ userData.curses.length })` ,
								'Текущее проклятие' ,
								'Текущие два проклятия' ,
								{ unite: ( _quantity , word ) => word } ,
							)
							const curse = userData.curses.at( interaction.currentCurseView )
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
					filter: () => userData.cursesEnded || userData.curses ,
				} ,
				{
					name: 'Бонусы котла <a:placeForVoid:780051490357641226>' ,
					value: `\`\`\`Уменьшений кулдауна: ${ ~~userData.voidCooldown }/20\nСкидок на котёл: ${ ~~userData.voidPrice }/3\nНестабилити: ${ ~~userData.voidDouble }/1\nУсиление квестов: ${ ~~userData.voidQuests }/5\nШанс коина: ${ ~~userData.voidCoins }/7 (${ percent_string( 1 / ( 85 * 0.9 ** userData.voidCoins ) ,
					) })\nМонстр-защитник: ${ ~~userData.voidMonster }/1\nКазино: ${ ~~userData.voidCasino }/1\nСвобода проклятий: ${ ~~userData.voidFreedomCurse }/1\nБонусы от перчаток: ${ ~~userData.voidThief }\nУмение заворож. Клевер: ${
						userData.voidMysticClover ?? 0
					}/50\nФермер: ${ userData.voidTreeFarm ?? 0 }\nНаграда коин-сообщений: ${
						35 + ( userData.coinsPerMessage || 0 )
					}\`\`\`` ,
					inline: false ,
				} ,
			].filter( field => !field.filter || field.filter() )

			return {
				title: `Статистика ${
					member?.displayName || target.globalName || target.username
				}` ,
				color: interaction.embedColor ,
				footer ,
				fields ,
				edit: interaction.controller.editEmbed ,
			}
		}

		const controller = interaction.controller
		controller.message = await msg.msg( await createEmbedAtFirstPage() )
		controller.editEmbed = true

		while ( true ) {
			sleep( SECOND * 8.5 )

			const react = await controller.message.awaitReact(
				{ user: 'any' , removeType: 'all' , time: 20 * SECOND } ,
				... controller.reactions ,
			)
			target.action( Actions.curseBeforeProgressDisplay , {} )

			switch ( react ) {
			case '640449848050712587':
				interaction.currentCurseView
						= ( interaction.currentCurseView + 1 ) % ( userData.curses?.length || 1 )
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
