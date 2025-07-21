import { SECOND } from '#constants/time.js'
import { AnonExpressionLexer , TokenTypeEnum } from '#src/anon/expression_parser.js'
import { AnonGame , ModesEnum } from '#src/anon/game.js'

import { addCoinFromMessage } from '#src/coin_message/requestCoinFromMessage.js'
import {
	BaseCommand ,
	BaseFlagSubcommand ,
} from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { MessageInterface } from '#src/discord/MessageInterface.js'
import { Pager } from '#src/discord/Pager.js'
import { ROMAN_NUMERALS_TABLE } from '#src/romanNumerals.js'
import { randomWith , timestampToDate } from '#src/safe-utils.js'
import { addMultipleResources } from '#src/user/resources/addResource.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'
import { randomNumberInRange } from '@zoodogood/utils/objectives'
import {
	CellAlignEnum ,
	ending ,
	TextTableBuilder ,
} from '@zoodogood/utils/primitives'
import { ButtonStyle , ComponentType , escapeMarkdown } from 'discord.js'

class CommandGuidances {
	constructor( context , command ) {
		this.context = context
		this.command = command
	}

	getGuidancePagesContent() {
		return [
			'Решайте запачканые уравнения' ,
			'Стандартные операторы:\n` "+" ` — сложение\n` "-" ` — вычитание\n` "*" ` — умножение\n` "/" ` — деление с округлением\n` "%" ` — остаток от деления\n` "**" ` — возведение в степень' ,
			'Побитовые операторы:\n` "&" ` — побитовое и (and)\n` "|" ` — побитовое или (or)\n` "~" ` — побитовое не (not)\n` "^" ` — побитовое исключающее или (xor)\n, — побитовые операторы воздействуют на каждый бит числа.\nПример: `0b1|0b01=0b11=1|2=3`\n\nПереведите в привычную систему счисления:\nвозведите число 2 в степень номера разряда для каждого бита, суммируйте\nПример: `0b111=(2**3+2**1+2**0)`\n\nДополнительно:\n- оператор побитового "не", по сути, заменяет два действия:\n\\×(-1) и -1, а именно пример: `~3=(3×(-1)-1)=-4`' ,
			'Логические значения:\n` "1" `, или любое значение, не ноль — вернуть истину\n` "0" ` — вернуть ложь\nОператоры:\n` "&&" ` — оператор логического "и"\n` "||" ` — логическое "или"\n` ">" ` — "больше"\n` "<" ` — "меньше"\n` "===" ` — "равенство"\n` "!" ` — логическое "отрицание"\n, — логические операторы не могут вернуть значение отличное от "0" или "1"\nПримеры: `1&&0=0`, `2===3=0`, `!10=0`, `!0=1`' ,
			`Приоритет операторов:\n${ ( () => {
				const tokens = Object.values( AnonExpressionLexer.Tokens ).filter(
					token => token.type === TokenTypeEnum.Operator ,
				)

				const prioritySet = [
					... new Set( tokens.map( token => token.operatorPriority || 0 ) ) ,
				]
					.sort()
					.map( String )

				const tokensTable = Array.from( { length: prioritySet.length } ).fill( '' )
				for ( const token of tokens ) {
					tokensTable[ token.operatorPriority ] += `\n${ token.symbol }`
				}
				const builder = ( new TextTableBuilder )
					.addRowWithElements( prioritySet , { align: CellAlignEnum.Center } )
					.addRowSeparator()
					.addMultilineRowWithElements( tokensTable , {
						removeNextSeparator: true ,
						gapLeft: 2 ,
						gapRight: 2 ,
					} )

				return `\`\`\`⠀\n${ builder.generateTextContent() }\`\`\``
			} )() },\n — где операция степени всегда будет выполняться первой, а логические — последними. В случае, если приоритет операторов одинаковый, операции выполняются последовательно` ,
			`Римские обозначения:\n${ Object.entries( ROMAN_NUMERALS_TABLE )
				.map( ( [ key , value ] ) => `\` "${ key }" \` — ${ value }` )
				.join( '\n' ) }` ,
			`Алгоритм решения Римских цифер:
Ищите наибольший элемент
- 1) Найдите символ, который обозначает наибольшее число
- 2) Если за ним следует идентичный символ, смело суммируйте их
- 3) Проверьте есть ли элементы слева от найденного
- 3.1) В случае, если Да, перейдите к шагу один и вновь найдите наибольший элемент из доступных. Результат отнимите от текущего наибольшего элемента: \`IV=5-1\`
- 4) Повторите шаги 3 и 3.1 для правой стороны. Результат прибавьте: \`VI=5+1\`
- 5) Выражение решено

Пример: \`VIXXI=(10+10-(5+1)+1)\`` ,
			'Крайние случаи:\nПроблема: **операторы находятся скраю от выражения или идут один за другим**\nПояснение: невалидные операторы должны быть проигнорированы, например, знак умножения не может находится по левому или правому краю\n\\*Знаки плюс или минус всегда валидны, если предшествуют числу.\nПример 1: `4*/2=4/2`, оператор умножения проверялся первым и был проигнорирован.\nПример 2: `+2=2`, знаку плюс необязательно иметь левого соседа\n\nПриоритет операторов не учитывается на этапе внутренней проверке их валидности' ,
		]
	}

	async onProcess( interaction ) {
		const pager = new Pager( interaction.channel )
		pager.addPages(
			... this.getGuidancePagesContent().map( description => ( {
				description ,
				fetchReply: true ,
			} ) ) ,
		)
		pager.setHideDisabledComponents( true )
		pager.updateMessage( interaction )
	}
}

class CommandRunContext extends BaseCommandRunContext {}

class CommandDefaultBehavior extends BaseFlagSubcommand {
	_interface = ( new MessageInterface )
	game = ( new AnonGame )
	async onProcess() {
		const { context } = this
		const { interaction } = context
		while ( true ) {
			if ( context.isEnd ) {
				return
			}
			try {
				await this.onLoopFrame( context )
			} catch ( error ) {
				console.error( error )
				const prompt = await interaction.channel.msg( {
					title: 'Команда завершена некоректно, нажмите чтобы продолжить' ,
					description: error.message ,
					components: justButtonComponents( { label: 'Продолжить' } ) ,
				} )
				const needResume = await prompt
					.awaitMessageComponent( {
						time: SECOND * 20 ,
						filter: ( { user } ) => interaction.user.id === user.id ,
					} )
					.catch( () => {} )

				prompt.delete()
				if ( needResume ) {
					continue
				}

				return this.end( context )
			}
		}
	}
}

class Command extends BaseCommand {
	componentsCallbacks = {
		watchInfo: async ( interaction , _ , context ) => {
			interaction.msg( {
				ephemeral: true ,
				content: 'Укажите индекс локации для дополнительных сведений' ,
			} )

			const answer = await interaction.channel.awaitMessage( {
				remove: true ,
				user: interaction.user ,
			} )
			if ( !answer ) {
				return
			}

			const { task }
				= context.auditor.at( +answer.content.match( /\d+/ )?.[ 0 ] - 1 ) ?? {}

			if ( !task ) {
				interaction.msg( {
					edit: true ,
					content: 'Нет, такой локации не найдено' ,
				} )
				return
			}

			const { mode , data , userInput , result } = task
			const logic = this.getContentLogicOfResult(
				task.mode === ModesEnum.ExpressionsInstead
					? task.userInput
					: task.data.expression ,
				task ,
				context ,
			)
			const taskData = JSON.stringify(
				{ ... data , userInput , result , logic } ,
				null ,
				'\t' ,
			)
			const modeLabel = ModesData[ mode ].label
			interaction.msg( {
				edit: true ,
				content: `**${ modeLabel }** )\n${ escapeMarkdown( taskData ) }` ,
			} )
		} ,
		displayRemainingTime: async ( interaction , _ , context ) => {
			const remaining
				= this.TIME_FOR_RESPONSE_ON_TASK - context.timeAuditor.getDifference()

			const content = `${ timestampToDate( remaining ) } для L${
				context.auditor.length + 1
			}`
			interaction.msg( { ephemeral: true , title: content , color: '#c0c0c0' } )
		} ,
		getGuidance: async ( interaction , _ , context ) => {
			new CommandGuidances( context , this ).onProcess( interaction )
		} ,
	}

	options = {
		name: 'anon' ,
		id: 63 ,
		media: {
			description:
				'Медленно адаптируется\nПримечание к выпуску: [побитовые операторы](https://learn.javascript.ru/bitwise-operators); Пока не ясно в каком направлении будет меняться эта команда' ,
			example: `!anon # без аргументов` ,
		} ,
		accessibility: {
			publicized_on_level: 10 ,
		} ,
		alias: 'анон' ,
		allowDM: true ,
		cooldown: 10 * SECOND ,
		type: 'other' ,
	}

	createMessageComponentCollector( message , context ) {
		context._collectors ||= {}

		if ( message.id in context._collectors ) {
			const collector = context._collectors[ message.id ]
			collector.resetTimer()
			return
		}

		const collector = message.createMessageComponentCollector( {
			time: this.TIME_FOR_RESPONSE_ON_TASK ,
		} )

		collector.on( 'collect' , interaction =>
			this.onComponent(
				{ interaction , rawParams: interaction.customId } ,
				context ,
				collector ,
			) )

		context._collectors[ message.id ] = collector

		collector.on( 'end' , () => {
			message.msg( { edit: true , components: [] } )
			delete context._collectors[ message.id ]
		} )
	}

	async displayAudit( context ) {
		const builder = ( new TextTableBuilder )
			.setBorderOptions()
			.addRowSeparator( ( { metadata: { tableWidth } } , index ) =>
				[ 0 , 1 , tableWidth - 1 , tableWidth - 2 ].includes( index ) ? '|' : ' ' ,
			)
			.addRowSeparator( ( { metadata: { tableWidth } } , index ) =>
				[ 0 , tableWidth - 1 ].includes( index ) ? '|' : index % 2 ? ' ' : '=' ,
			)
			.addRowSeparator( ( { metadata: { tableWidth } } , index ) =>
				[ 0 , tableWidth - 1 ].includes( index ) ? '|' : ' ' ,
			)

		const isExpressionInstead = task =>
			task.mode === ModesEnum.ExpressionsInstead

		const fields = context.auditor.map( ( { count , task , timeResult } , i ) => {
			const stage = task.isResolved
				? `${ this.stageCodename( i ) } ${ i + 1 }.`
				: '(×)'

			return `${ stage }\n(${ count }${
				isExpressionInstead( task ) ? '*' : ''
			}): ${ Math.floor( timeResult / SECOND ) }с.`
		} )

		while ( fields.length ) {
			builder.addMultilineRowWithElements(
				[ fields.shift() , fields.shift() ?? '0' ] ,
				{ align: CellAlignEnum.Center , gapLeft: 1 , gapRight: 1 } ,
				{ minWidth: 15 } ,
			)
			builder.addRowSeparator( ( { metadata } , index ) =>
				metadata.separatorsIndexesInRow.includes( index ) ? '+' : '-' ,
			)
		}

		builder.addRowSeparator( () =>
			!randomWith( 2 ) ? '/' : !randomWith( 20 ) ? '⚘' : !randomWith( 20 ) ? '❀' : ' ' ,
		)

		const content = `\`\`\`\n${ builder.generateTextContent() }\`\`\``
		const customId = 'watchInfo'

		const components = {
			emoji: '👀' ,
			type: ComponentType.Button ,
			style: ButtonStyle.Secondary ,
			customId ,
		}
		const message = await context.interaction.channel.msg( {
			content ,
			components ,
		} )

		this.createMessageComponentCollector( message , context )
	}

	displayReward( context , { experience , coinOdds , bonuses } ) {
		const { interaction } = context
		interaction.channel.msg( {
			reference: context.messageInterface.id ,
			content: `Получено немного опыта: ${ experience } (по формуле: количество блоб * ${
				this.EXPERIENCE_FOR_STICK
			} ** 1.007). Шанс получить коин: ${ Math.ceil(
				Math.min( 100 , coinOdds ) ,
			) }%\n${
				bonuses
					? `Получено немного сокровищ с обратных выражений: ${ bonuses }`
					: ''
			}` ,
		} )
	}

	end( context ) {
		if ( !context.auditor.length ) {
			context.messageInterface.delete()
			return
		}

		context.isEnd = true
		this.updateMessageInterface( context )

		const { user } = context.interaction
		const { coinOdds , experience , bonuses } = this.reward( context )

		if ( randomWith( Math.floor( 99 / coinOdds ) ) === 0 ) {
			addCoinFromMessage( context.lastAnswer )
		}

		addMultipleResources( {
			user ,
			executor: user ,
			source: 'command.anon.end' ,
			context ,
			resources: {
				[ PropertiesEnum.exp ]: experience ,
				[ PropertiesEnum.chestBonus ]: bonuses ,
			} ,
		} )

		this.displayReward( context , { coinOdds , experience , bonuses } )

		this.displayAudit( context )

		this.processMonkeyPaschal( context )
	}

	generateTaskData( context ) {
		const {
			currentTask: { mode } ,
			averageSticksCount ,
		} = context
		return mode === ModesEnum.ExpressionsInstead
			? { value: randomNumberInRange( { max: averageSticksCount ** 1.2 } ) }
			: { expression: this.generateStroke( context ) }
	}

	generateTextContentOfTask( context ) {
		const { currentTask: task , interaction , isEnd , auditor } = context
		const isExpressionInstead = task.mode === ModesEnum.ExpressionsInstead
		const isDefaultMode = task.mode === ModesEnum.Default

		const direct = isEnd
			? `The end, ты успешно решил ${ ending(
				auditor.length - 1 ,
				'пример' ,
				'ов' ,
				'' ,
				'а' ,
			) }`
			: isExpressionInstead
				? 'Введи выражение (обратная операция):'
				: 'Введи число: количество палочек. Математические операции между ними включены (округление всегда к меньшему):'
		const dataContent = ( () => {
			const isMirrorMode = task.mode === ModesEnum.Mirror
			let value
			value = isExpressionInstead
				? String( task.data.value )
				: task.data.expression

			value = escapeMarkdown( value )
			isMirrorMode
			&& ( () => {
				value = [ ... value ]
					.reverse()
					.join( '' )
					.replace( /(\()|(\))/g , full => ( full === '(' ? ')' : '(' ) )
			} )()

			const allowSpoliersInText = task.mode === ModesEnum.NoComma

			allowSpoliersInText
			&& ( () => {
				value = value.replaceAll( '\\|' , '|' )
			} )()

			const content = isExpressionInstead
				? `Ожидамое значение: ${ value }`
				: value
			return content
		} )()

		const bananaContent = !randomWith( 20 ) ? ' :banana:' : ''

		const { label: modeLabel , description: modeDescription }
			= ModesData[ task.mode ]
		return `${ interaction.user.toString() }, ${ direct }${ bananaContent }\n${ dataContent }\n\n${
			!isDefaultMode ? `**${ modeLabel }** )\n${ modeDescription }` : ''
		} `
	}

	generateTextContentOnFail( context ) {
		const { currentTask: task } = context

		const expression
			= task.mode === ModesEnum.ExpressionsInstead
				? task.userInput
				: task.data.expression
		const result = this.calculateResult( expression , context )
		const logicOfResult = this.getContentLogicOfResult(
			expression ,
			task ,
			context ,
		)
		return `неть || ${ logicOfResult } || === || ${ result } ||`
	}

	getContentLogicOfResult( expression , task , context ) {
		const logic
			= task.mode === ModesEnum.JustCount
				? `${ getStickSymbolOfTask( task ) } × ${ task.stickCount() }`
				: this.cleanExpression( expression , context )

		return escapeMarkdown( logic )
	}

	getContext( interaction ) {
		return {
			interaction ,
			messageInterface: null ,
			lastAnswer: null ,
		}
	}

	getTaskContentComponents( context ) {
		const { isEnd } = context
		return isEnd
			? []
			: [
				{
					type: ComponentType.Button ,
					label: '- Оставшееся время' ,
					style: ButtonStyle.Secondary ,
					customId: 'displayRemainingTime' ,
				} ,
				{
					type: ComponentType.Button ,
					emoji: '📗' ,
					style: ButtonStyle.Secondary ,
					customId: 'getGuidance' ,
				} ,
			]
	}

	increaseAverageSticksCount( context ) {
		context.averageSticksCount *= 1.35
		context.averageSticksCount **= 1.05
		context.averageSticksCount = Math.min( context.averageSticksCount , 300 )
	}

	async onChatInput( msg , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	run( context ) {
		new CommandDefaultBehavior( context , this ).onProcess()
	}

	async updateMessageInterface( context ) {
		const { interaction } = context
		const isMessageExists = !!context.messageInterface
		const target = isMessageExists
			? context.messageInterface
			: interaction.channel

		context.messageInterface = await target.msg( {
			edit: isMessageExists ,
			content: this.generateTextContentOfTask( context ) ,
			reference: interaction.message.id ,
			components: this.getTaskContentComponents( context ) ,
		} )

		this.createMessageComponentCollector( context.messageInterface , context )
		return context.messageInterface
	}
}

export default Command
