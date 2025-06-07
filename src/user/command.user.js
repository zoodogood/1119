import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'

import { takeInteractionProperties , tryMemberOf } from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { EXPERIENCE_PER_LEVEL } from '#src/level/constants.js'
import { _do , accessorWithState , checkFilterPropertyFactory , increment } from '#src/mini.js'
import QuestManager , { isSimpleGlobalQuest } from '#src/quests/QuestManager.js'
import {
	maybe_multiline ,
	NumberFormatLetterize ,
	sleep ,
	timestampToDate ,
} from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import Template from '#src/VirtualMachine/Template.js'
import { PresenceUpdateStatus } from 'discord.js'
import { MONTH , SECOND , YEAR } from '../constants/time.js'
import { getCursesProgressContent } from '../curses/text_templates.js'
import { userDataOf } from '../data/singleton.js'
import { percent_string } from '../formatters/formatters.js'

function guildRankMembers( guild ) {
	return guild.members.cache
		.map( m => m.user )
		.filter( u => !u.bot )
		.filter( u => userDataOf( u ).level > 1 )
}
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
		const { mentionedOrAuthor: target , guild } = interaction
		const member = tryMemberOf( guild , target )
		const userData = userDataOf( target )

		const { level , profile_color , curses , coins , exp , last_online , profile_confidentiality , profile_description , questsGlobalCompleted , quest , chilli , monster , seed , snowyTree , lollipops , presents , cheese , thiefGloves , thiefCombo , thiefWins , element , chestBonus , chestLevel , dayQuests , cursesEnded , voidCasino , voidCoins , voidCooldown , voidDouble , voidFreedomCurse , voidMysticClover , voidPrice , voidQuests , voidRituals , voidThief , voidTreeFarm , voidMonster , coinsPerMessage , berrys , elementLevel , praiseMe , keys , praise } = userData

		target.action( Actions.curseBeforeProgressDisplay , {} )
		target.action( Actions.beforeProfileDisplay , interaction )

		const rank = member && level > 1 && _do( () => {
			const members = guildRankMembers( guild )
			const memberPosition = members
				.sort( ( b , a ) =>
					userDataOf( a ).level - userDataOf( b ).level || userDataOf( a ).exp - userDataOf( b ).exp ,
				)
				.indexOf( target )

			return { members , memberPosition , membersSize: members.length }
		} )
		const currentCurseAtView = accessorWithState(
			0 ,
			v => v ,
			v => v % ( curses?.length || 1 ) ,
		)

		const embedColor = profile_color || 'Random'

		if ( guild && member === undefined ) {
			msg.msg( {
				title: 'На сервере нет упомянутого пользователя' ,
				color: '#ff0000' ,
				delete: 9 * SECOND ,
			} )
			return
		}

		QuestManager.checkAvailable( { user: target } )
		CurseManager.checkAvailableAll( target )

		const _interface = {
			created_message_instance: null ,
			reactions: [ '640449832799961088' ] ,
		}
		_interface.created_message_instance = await msg.msg( await createEmbedAtFirstPage() )

		while ( true ) {
			sleep( SECOND * 8.5 )

			const react = await _interface.created_message_instance.awaitReact(
				{ user: 'any' , removeType: 'all' , time: 20 * SECOND } ,
				... _interface.reactions ,
			)
			target.action( Actions.curseBeforeProgressDisplay , {} )

			switch ( react ) {
			case '640449848050712587':
				increment( currentCurseAtView )
				await _interface.created_message_instance.msg( await createEmbedAtFirstPage() )
				_interface.reactions = [ '640449832799961088' ]
				break

			case '640449832799961088':
				await _interface.created_message_instance.msg( await createEmbedAtSecondPage() )
				_interface.reactions = [ '640449848050712587' ]
				break

			default:
				return
			}
		}

		async function createEmbedAtFirstPage() {
			if (
				!interaction._status
				&& ( member?.presence
					&& member.presence._status !== PresenceUpdateStatus.Offline )
				|| target === msg.author
			) {
				interaction._status = '<:online:637544335037956096> В сети'
			} else {
				interaction._status = maybe_multiline( [
					`<:offline:637544283737686027> Не в сети ` ,
					!profile_confidentiality && _do( () => {
						const lastOnline = Date.now() - ( last_online ?? 0 )
						switch ( true ) {
						case lastOnline > YEAR:
							return 'более года'

						case lastOnline > MONTH:
							return 'более месяца'

						default:
							return timestampToDate( lastOnline )
						}
					} ) ,
				] )
			}

			const description = maybe_multiline( [
				`Коинов: **${ NumberFormatLetterize(
					coins ,
				) }**<:coin:637533074879414272> \n` ,
				`<a:crystal:637290417360076822>Уровень: **${ level || 1 }** \n` ,
				`<:crys:637290406958202880>Опыт: **${ exp || 0 }/${ ( level || 1 ) * EXPERIENCE_PER_LEVEL }**\n\n` ,
				`${ interaction._status }\n` ,
			] )

			const fields = [
				{ name: ' ᠌' , value: ' ᠌' } ,
				profile_description && await ( async () => {
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
					).replaceAll( profile_description , msg )
					return { name: 'О пользователе: ᠌' , value: about }
				} )() ,
				( member ) && ( () => {
					const secretAchievements = QuestManager.questsBase
						.filter(
							questBase => questBase.isGlobal && questBase.isSecret && !questBase.isRemoved ,
						)
						.filter( questBase => questsGlobalCompleted?.includes( questBase.id ) ,
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
					const questBase = QuestManager.questsBase.get( quest.id )
					const value = quest.isCompleted
						? ' – Квест выполнен'
						: `${ questBase.description } ${ quest.progress }/${ quest.goal }`
					return { name: '\nКвест:' , value }
				} )() ,
				( curses?.length ) && {
					name: '᠌᠌' ,
					value: `Прогресс проклятия: ${ getCursesProgressContent( curses ) }` ,
				} ,
			].filter( Boolean )

			return {
				title: 'Профиль пользователя' ,
				author: {
					name: `#${ target.username }` ,
					iconURL: target.avatarURL( { dynamic: true } ) ,
				} ,
				color: embedColor ,
				edit: !!_interface.is_message_instance_created ,
				description ,
				fields ,
				footer: {
					text: maybe_multiline( [
						`Похвал: ${ praiseMe?.length || '0' }   ` ,
						rank
						&& `Ранг: ${ rank.memberPosition !== -1
							? `${ rank.memberPosition }/${ rank.membersSize }`
							: 'Недоступно' }` ,
					] ) ,
				} ,
			}
		}

		async function createEmbedAtSecondPage() {
			const footer = member
				? {
					text: `На сервере с ${ new Intl.DateTimeFormat( 'ru-ru' , {
						day: 'numeric' ,
						year: 'numeric' ,
						month: 'long' ,
					} ).format( member.joinedTimestamp ) }` ,
				}
				: null

			const contents = {}
			const inventory = [
				`🔩${ keys }` ,
				`<a:void:768047066890895360>${ userData.void }` ,
				`🧤${ thiefGloves ? `${ thiefGloves }|${ thiefCombo || 0 }` : 0 }|${ thiefWins ? String( thiefWins ).replace( '-' , '!' ) : '0' }` ,
				`${ chilli ? `🌶️${ chilli }` : '' }` ,
				`${ monster ? `🐲${ monster }` : '' }` ,
				`${ seed ? `🌱${ seed }` : '' }` ,
				`${ snowyTree ? `${ Emoji.snowyTree }${ snowyTree }` : '' }` ,
				`${ lollipops ? `${ Emoji.lollipops }${ lollipops }` : '' }` ,
				`${ presents ? `🎁${ presents }` : '' }` ,
				`${ cheese ? `🧀${ cheese }` : '' }` ,
			]

			if ( element ) {
				const emoji = [ '🍃 Земля' , '☁️ Воздух' , '🔥 Огонь' , '👾 Тьма' ][ element ]
				const content = `\n${ emoji } — элемент ${ ( elementLevel ?? 0 ) + 1 } ур.\n`
				contents.element = content
			}

			const fields = [
				{
					name: 'Клубники <:berry:756114492055617558>' ,
					value: `Имеется: ${ berrys }` ,
					inline: true ,
				} ,
				{
					name: `Сундук ${ userData.CD_32 > Date.now()
						? '<:chest_opened:986165753843679232>'
						: '<a:chest:805405279326961684>' }` ,
					value: `Сундук ур.: ${ chestLevel + 1 }\nБонус след. открытия: \`${ chestBonus || 0 }\`` ,
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
						const userCompleted = ( questsGlobalCompleted ?? '' )
							.split( ' ' )
							.filter( Boolean )

						const bases = QuestManager.questsBase.filter(
							quest => userCompleted.includes( quest.id ) || isSimpleGlobalQuest( quest ) ,
						)
						const globalsContent = `Глобальных: ${ userCompleted.length }/${ bases.size }`
						const dailyQuestsContent = `Ежедневных: ${ target.bot ? 'BOT' : dayQuests || 0 }`
						return `${ dailyQuestsContent }\n${ globalsContent }`
					} )() ,
					inline: false ,
				} ,
				{
					name: 'Проклятия 💀' ,
					value: ( () => {
						const surviveContent = `Пережито проклятий: ${ cursesEnded || 0 }`
						const getCurrentContent = () => {
							if ( !curses?.length ) {
								return 'Проклятия отсуствуют.'
							}

							const count = _do( () => {
								switch ( curses.length ) {
								case 1: return 'Текущее проклятие'

								case 2: return 'Текущие два проклятия'

								default: return `Текущие проклятия (их ${ curses.length })`
								}
							} )

							const curse = curses.at( currentCurseAtView() )
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
					filter: () => cursesEnded || curses ,
				} ,
				{
					name: 'Бонусы котла <a:placeForVoid:780051490357641226>' ,
					value: `\`\`\`Уменьшений кулдауна: ${ ~~voidCooldown }/20\nСкидок на котёл: ${ ~~voidPrice }/3\nНестабилити: ${ ~~voidDouble }/1\nУсиление квестов: ${ ~~voidQuests }/5\nШанс коина: ${ ~~voidCoins }/7 (${ percent_string( 1 / ( 85 * 0.9 ** voidCoins ) ,
					) })\nМонстр-защитник: ${ ~~voidMonster }/1\nКазино: ${ ~~voidCasino }/1\nСвобода проклятий: ${ ~~voidFreedomCurse }/1\nБонусы от перчаток: ${ ~~voidThief }\nУмение заворож. Клевер: ${ voidMysticClover ?? 0 }/50\nФермер: ${ voidTreeFarm ?? 0 }\nНаграда коин-сообщений: ${ 35 + ( coinsPerMessage || 0 ) }\`\`\`` ,
					inline: false ,
				} ,
			].filter( checkFilterPropertyFactory() )

			return {
				title: `Статистика ${ member?.displayName || target.globalName || target.username }` ,
				color: embedColor ,
				footer ,
				fields ,
				edit: !!_interface.is_message_instance_created ,
			}
		}
	}
}

export default Command
