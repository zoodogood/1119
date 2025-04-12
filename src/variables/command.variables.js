import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { PermissionsBits } from '#src/discord/permissions.js'
import { take_missing_permissions } from '#src/discord/utils.js'
import { sortByResolveMut } from '#src/mini.js'
import GuildVariablesManager from '#src/variables/GuildVariablesManager.js'
import { randomElementFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'
import { escapeMarkdown } from 'discord.js'
import { guildDataOf } from '../data/singleton.js'

class Command extends BaseCommand {
	static actionsList = [
		{
			id: 'set' ,
			emoji: '🐵' ,
			description: 'Установить новую переменную.' ,
			checkPermission: true ,
			async callback( interaction , manager ) {
				const channel = interaction.channel
				const questionMessage = await channel.msg( {
					title: 'Для установки...' ,
					description: `Упомяните пользователя, укажите имя переменной и её значение в указанном порядке. Пропустите первый аргумент, чтобы установить переменную глобально. Её имя должно состоять из одного слова.` ,
				} )

				const answer = (
					await channel.awaitMessage( { user: interaction.user , remove: true } )
				)?.content

				questionMessage.delete()
				if ( !answer ) {
					return
				}

				const params = this.parseParams( answer )
				const targetId = params.targetId ?? interaction.guild.id
				const targetName = this.takeNameFor( targetId , interaction )

				const needIncrease
					= params.value.startsWith( '+' ) || params.value.startsWith( '-' )

				const method = needIncrease
					? manager.interface.increase
					: manager.interface.set

				const value = method.apply( manager.interface , [
					targetId ,
					params.name ,
					params.value ,
				] )
				this.displaySetValue( {
					interaction ,
					targetName ,
					name: params.name ,
					value ,
				} )
			} ,
		} ,
		{
			id: 'get' ,
			emoji: '🙊' ,
			description: 'Получить значение.\n' ,
			checkPermission: false ,
			async callback( interaction , manager ) {
				const channel = interaction.channel
				const questionMessage = await channel.msg( {
					title: 'Для получения...' ,
					description: `Упомяните пользователя и укажите имя переменной в указанном порядке. Пропустите первый аргумент, чтобы получить переменную установленную глобально. Её имя должно состоять из одного слова.` ,
				} )

				const answer = (
					await channel.awaitMessage( { user: interaction.user , remove: true } )
				)?.content

				questionMessage.delete()
				if ( !answer ) {
					return
				}

				const params = this.parseParams( answer )
				const targetId = params.targetId ?? interaction.guild.id
				const targetName = this.takeNameFor( targetId , interaction )

				const value = manager.interface.get( targetId , params.name )
				this.displayGetValue( {
					interaction ,
					targetName ,
					name: params.name ,
					value ,
				} )
			} ,
		} ,
		{
			id: 'list' ,
			emoji: '🐭' ,
			description: 'Открыть Список.' ,
			checkPermission: false ,
			async callback( interaction , manager ) {
				const list = {}
				const increase = key => ( list[ key ] ||= 0 ) & list[ key ]++

				for ( const target of Object.values( manager.data ) ) {
					for ( const key in target ) increase( key )
				}

				const description = Object.entries( list )
					.map(
						( [ key , count ] ) =>
							`${ escapeMarkdown( key ) }・${ ending( count , 'раз' , '' , '' , 'а' ) }` ,
					)
					.join( '\n' )

				await interaction.controllerMessage.msg( {
					title: '🐭 Окно управления переменными сервера' ,
					description: `Каждая переменная встречается..\n${
						description || 'Ой, а здесь тоже пусто'
					}` ,
					edit: true ,
					color: this.constructor.MAIN_COLOR ,
				} )
			} ,
		} ,
		{
			id: 'find' ,
			emoji: '🦞' ,
			description: 'Провести поиск по имени и отсортировать.' ,
			checkPermission: false ,
			async callback( interaction , manager ) {
				const channel = interaction.channel
				const questionMessage = await channel.msg( {
					title: 'Введите имя переменной, для её поиска среди пользователей' ,
				} )

				const answer = (
					await channel.awaitMessage( { user: interaction.user , remove: true } )
				)?.content

				questionMessage.delete()
				if ( !answer ) {
					return
				}

				const param = answer.split( ' ' ).at( 0 )
				const description = sortByResolveMut(
					Object.entries( manager.data )
						.filter( ( [ _id , targetData ] ) => param in targetData )
						.map( ( [ id , targetData ] ) => [ id , targetData[ param ] ] ) ,
					$ => $[ 1 ] ,
				)
					.map(
						( [ id , value ] ) =>
							`${ id === interaction.guild.id ? 'Сервер' : `<@${ id }>` }・${ value }` ,
					)
					.join( '\n' )

				await interaction.controllerMessage.msg( {
					title: '🦞 Окно управления переменными сервера' ,
					description ,
					edit: true ,
					color: this.constructor.MAIN_COLOR ,
				} )
			} ,
		} ,
		{
			id: 'random' ,
			emoji: '🐣' ,
			description: 'Просто дайте мне случайную переменную.' ,
			checkPermission: false ,
			async callback( interaction , manager ) {
				const targetId = randomElementFromArray( manager.interface.keys() )
				const entries = manager.interface.entriesOf( targetId )

				const [ name , value ] = randomElementFromArray( entries )
				const description = `Переменная ${ this.takeNameFor(
					targetId ,
					interaction ,
				) } — \`${ escapeMarkdown( name ) }\`・${ escapeMarkdown( value ) }`

				await interaction.controllerMessage.msg( {
					title: '🐣 Ваша случайная переменная' ,
					description ,
					color: this.constructor.MAIN_COLOR ,
				} )
			} ,
		} ,
		{
			id: 'remove' ,
			emoji: '🐲' ,
			description: 'Убрать.' ,
			checkPermission: true ,
			async callback( interaction , manager ) {
				const channel = interaction.channel
				const questionMessage = await channel.msg( {
					title: 'Для очистки...' ,
					description: `Упомяните пользователя и укажите имя переменной. Пропустите первый аргумент, удалить переменную у всех пользователей*!. Укажите айди гильдии вместо упоминания, чтобы очистить только глобально установленную.` ,
				} )

				const answer = (
					await channel.awaitMessage( { user: interaction.user , remove: true } )
				)?.content

				questionMessage.delete()
				if ( !answer ) {
					return
				}

				const params = this.parseParams( answer )
				const targetId = params.targetId ?? null

				const willRemoved = [ targetId ].filter( Boolean )
				if ( targetId === null ) {
					const list = Object.entries( manager.data )
						.filter( ( [ _id , targetData ] ) => params.name in targetData )
						.map( ( [ id ] ) => id )

					willRemoved.push( ... list )
				}

				willRemoved.forEach( id => manager.interface.remove( id , params.name ) )

				const description = `Была произведена очистка ${ ending(
					willRemoved.length ,
					'элемент' ,
					'ов' ,
					'а' ,
					'ов' ,
				) }`

				await interaction.controllerMessage.msg( {
					title: '🐲 Результат очистки' ,
					description ,
					color: this.constructor.MAIN_COLOR ,
				} )
			} ,
		} ,
	]

	static MAIN_COLOR = '#ffc135'

	options = {
		name: 'variables' ,
		id: 35 ,
		media: {
			description:
				'Вы можете присваивать пользователям информацию, удобно изменять её и просматривать.\nЭто полезная и универсальная функция для РП серверов, хотя для большенства она может оказаться бесполезной.' ,
			example: `!variables <memb | "сервер"> <propertyName> <properyValue> # propery переводится как: "свойство"` ,
		} ,
		accessibility: {
			publicized_on_level: 15 ,
		} ,
		alias: 'variable вар var переменная переменные змінні' ,
		allowDM: true ,
		type: 'guild' ,
		userPermissions: PermissionsBits.PrioritySpeaker ,
	}

	async createController( { interaction , manager } ) {
		const isAdmin
			= take_missing_permissions( interaction.member , PermissionsBits.ManageGuild )
				.length === 0

		const data = manager.data

		const count = Object.values( data ).reduce(
			( acc , target ) => acc + Object.keys( target ).length ,
			0 ,
		)
		const countOfYou = manager.interface.entriesOf( interaction.user.id ).length
		const embed = {
			title: 'Окно управления переменными сервера' ,
			description: `Количество переменных сервера: ${ count }${
				countOfYou ? `\nУ вас свойств: ${ countOfYou }` : ''
			}\n\n${ this.constructor.actionsList
				.map( ( { emoji , description } ) => `${ emoji } ${ description }` )
				.join( '\n' ) }` ,
			color: this.constructor.MAIN_COLOR ,
			reactions: this.constructor.actionsList
				.filter( action => !action.checkPermission || isAdmin === true )
				.map( ( { emoji } ) => emoji ) ,
		}
		interaction.controllerMessage = await interaction.channel.msg( embed )
		const filter = ( reaction , user ) => user === interaction.user && reaction.me
		const collector = interaction.controllerMessage.createReactionCollector( {
			filter ,
			time: 100_000 ,
		} )
		collector.on( 'collect' , ( reaction ) => {
			const action = this.constructor.actionsList.find(
				action => action.emoji === reaction.emoji.name ,
			)
			action.callback.call( this , interaction , manager )
		} )

		collector.on( 'end' , () =>
			interaction.controllerMessage.reactions.removeAll() )
	}

	displayGetValue( { interaction , targetName , name , value } ) {
		interaction.message.msg( {
			title: 'Значение переменной' ,
			description: `Переменная ${ targetName }, \`${ name }\` сейчас установлена в значении ${
				value ?? 'void (не существует)'
			}.\n🙊` ,
			color: this.constructor.MAIN_COLOR ,
		} )
	}

	displayListOf( { interaction , targetName , entries } ) {
		const listContent = entries.length
			? entries
				.map(
					( [ name , value ] ) =>
						`${ name }・${
							value.length > 20 ? `${ value.slice( 0 , 15 ) }..` : value
						}` ,
				)
				.join( '\n' )
			: 'Здесь пусто'

		interaction.message.msg( {
			color: this.constructor.MAIN_COLOR ,
			description: `> Переменные ${ targetName }\n${ escapeMarkdown( listContent ) }` ,
			footer: {
				text: `Создано (${ entries.length }/${ GuildVariablesManager.LIMIT })` ,
			} ,
		} )
	}

	displaySetValue( { interaction , targetName , name , value } ) {
		interaction.message.msg( {
			title: 'Значение переменной изменено' ,
			description: `Переменная ${ targetName }, \`${ name }\` успешно уставновлена в значение ${ value }.\n🐵` ,
			color: this.constructor.MAIN_COLOR ,
		} )
	}

	async onChatInput( msg , interaction ) {
		const manager = new GuildVariablesManager( guildDataOf( interaction.guild ) )
		const isAdmin
			= take_missing_permissions( interaction.member , PermissionsBits.ManageGuild )
				.length === 0

		if ( interaction.params ) {
			const params = this.parseParams( interaction.params )

			const targetId = params.targetId ?? interaction.guild.id
			const targetName = this.takeNameFor( targetId , interaction )

			if ( !params.name && !params.value ) {
				const entries = manager.interface.entriesOf( targetId )
				this.displayListOf( { interaction , targetName , entries } )
				return
			}

			if ( !valueParameter ) {
				const value = manager.interface.get( targetId , params.name )
				this.displayGetValue( {
					interaction ,
					targetName ,
					name: params.name ,
					value ,
				} )
				return
			}

			if ( params.name && params.value ) {
				const needIncrease
					= params.value.startsWith( '+' ) || params.value.startsWith( '-' )

				const method = needIncrease
					? manager.interface.increase
					: manager.interface.set

				const value = method.apply( manager.interface , [
					targetId ,
					params.name ,
					params.value ,
				] )
				this.displaySetValue( {
					interaction ,
					targetName ,
					name: params.name ,
					value ,
				} )
				return
			}
		}

		return this.createController( { interaction , manager } )
	}

	parseParams( params ) {
		params = params.split( ' ' )
		const targetId = params.at( 0 ).match( /\d{17,19}/ )
		if ( targetId ) {
			params.splice( 0 , 1 )
		}

		const name = params.splice( 0 , 1 ).at( 0 )
		const value = params.join( ' ' )
		return { targetId , name , value }
	}

	takeNameFor( targetId , interaction ) {
		return targetId === interaction.guild.id
			? 'Сервера'
			: `Пользователя <@${ targetId }>`
	}
}

export default Command

// let youre = manager.variables[msg.author.id] ? Object.keys(manager.variables[msg.author.id]) : [];
//     manager.embed = {
//       title: "Окно управления переменными сервера",
//       description: `Количество переменных сервера: ${Object.values(manager.variables).reduce((acc, last) => acc + Object.keys(last).length, 0)}${youre.length ? "\nУ вас свойств: " + youre.length : ""}\n\n🐵 Установить новую переменную.\n🙊 Получить значение переменной.\n\n🐭 Открыть Список.\n🦅 Найти по названию.\n🐣 Топ пользователей по свойству.\n🐲 Удалить переменную.`,
//       color: "#ffc135"
//     };
//     let baseReactions = ["🐭", "🦅", "🐣"];
//     if (isAdmin){
//       baseReactions.unshift("🐵", "🙊");
//       baseReactions.push("🐲");
//     }

//     manager.interface = await msg.msg(manager.embed);
//     manager.embed.edit = true;
//     delete manager.embed.description;

//     let
//       react, answer, fields = [],
//       page = 0, pages = [];

//     let output;
//     while (true) {
//       react = await manager.interface.awaitReact({user: msg.author, removeType: "one"}, ...baseReactions, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null));
//       switch (react) {
//         case "🐵":
//           answer = await msg.channel.awaitMessage(msg.author, {title: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
//           if (!answer){
//             return;
//           }

//           target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
//           if (!target){
//             msg.msg({title: "Не указана цель для которой нужно установить значение", color: "#ff0000", delete: 5000});
//             break;
//           }

//           answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
//           target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
//           answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

//           if (!answer.content[1]){
//             msg.msg({title: "Должно быть указано имя и значение", color: "#ff0000", delete: 3000});
//             break;
//           }

//           output = manager.set(target, answer.content[0], answer.content.slice(1).join(" "));
//           if (output.err){
//             let err;
//             switch (output.err) {
//               case 1:
//                 err = "Имя переменной содержит нежелательные символы";
//                 break;
//               case 2:
//                 err = "Достигнут максимум: 20 свойств на персону";
//                 break;
//               default:
//                 err = "Неизвестный тип ошибки";
//             }
//             msg.msg({title: err, color: "#ff0000", delete: 4000});
//             return;
//           }

//           msg.msg({title: "Переменная изменена:", description: `Переменная \`${output.name}\` ${targetName(answer)} установлена в значение ${output.value}`});
//           fields = [{name: "Вы успешно установили переменную", value: `🐵`}];
//           break;

//         case "🙊":
//           answer = await msg.channel.awaitMessage(msg.author, {title: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
//           if (!answer){
//             return;
//           }

//           target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
//           if (!target){
//             msg.msg({title: "Не указана цель, значение свойства которой нужно получить", color: "#ff0000", delete: 5000});
//             break;
//           }

//           answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
//           target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
//           answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

//           if (!answer.content[0]){
//             msg.msg({title: "Должно быть указано имя свойства", color: "#ff0000", delete: 3000});
//             break;
//           }

//           output = manager.get(target, answer.content[0]);
//           fields = [{name: `Переменная ${targerName(answer)} ${output.name}...`, value: `сейчас установлена в значении \`${output.value}\`🐵`}];
//           break;

//         case "🐭":
//           fields = Object.entries(manager.list()).map(([name, count]) => ({name, value: `Повторяется: ${ending(count, "раз", "", "", "а")}`}));
//           break;

//         case "🦅":
//           answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной, для её поиска среди пользователей`, description: ""});
//           if (!answer){
//               return;
//           }
//           fields = Object.entries(manager.search(answer.content)).map(([id, value], i) => ({name: `${id === "guild" ? "Сервер" : msg.guild.members.cache.get(id).displayName}:`, value: `\`${value}\``}));
//           break;

//         case "🐣":
//           answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной для отображения по ней ТОП-а пользователей`, description: ""});
//           if (!answer){
//               return;
//           }

//           fields = manager.top(answer.content).filter(e => e[0] != "guild").map(([id, value], i) => ({name: `${i + 1}. ${msg.guild.members.cache.get(id).displayName}`, value}));
//           break;

//         case "🐲":
//           answer = await msg.channel.awaitMessage(msg.author, {title: `Введите имя переменной, она будет удалена у всех пользователей`, embed: {description: "Через пробел вы можете указать цель, тогда свойство удалится только у неё"}});
//           target = answer.content.match(/(?:<@!?\d{17,19}>|guild|сервер|server)$/i);
//           if (target){
//             answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
//             target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
//           }

//           output = manager.remove(answer.content, target);
//           fields = [{name: "Удалено", value: `Удалено ${ ending(+output, "свойств", "", "о", "а")} с названием ${answer.content}`}];
//           break;

//         default: return;
//       }
//       if (react != "640449848050712587" && react != "640449832799961088"){
//         page = 0;
//         pages = [];
//         while (fields.length) pages.push(fields.splice(0, 10));
//       }
//       fields = (pages[0]) ? pages[page] : [{name: "Здесь пусто", value: "А здесь и вправду пусто..."}];
//       manager.embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
//       manager.embed.fields = fields;

//       manager.interface.msg({title: `${ react } Окно управления переменными сервера`, ...manager.embed});
//     }

//   }
