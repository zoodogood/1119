import { PropertiesEnum } from '#src/data/Properties.js'
import { addResource } from '#root/src/user/resources/addResource.js'
import { maybe_multiline } from '#src/safe-utils.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'
import { ending } from '@zoodogood/utils/primitives'

export function onPresentsChatInputCommand( user , curse , context ) {
	const { progress: snowflakes } = curse.values
	const SNOWFLAKES_TO_PRESENT = 200
	const presentsAdded = Math.floor( snowflakes / SNOWFLAKES_TO_PRESENT )

	{
		addResource( {
			user ,
			source: 'curseManager.events.happySnowy.present' ,
			resource: PropertiesEnum.presents ,
			value: presentsAdded ,
			executor: user ,
			context: { curse , primary: context } ,
		} )
		curse.values.progress -= SNOWFLAKES_TO_PRESENT * presentsAdded
	}

	const present_actions_payload = {
		image:
			'https://media.discordapp.net/attachments/629546680840093696/1180210287014576248/presentbox_.png?ex=657c977b&is=656a227b&hm=cfb15e12d3b7ea6e34c9d5f0d724f3e94fd128f6fdd11bb2f23a4d8dec8c07e4&=&format=webp&quality=lossless&width=677&height=677' ,
		components: justButtonComponents(
			{
				label: 'Открыть сейчас' ,
				customId: `@curseManager/events/happySnowy:open_present:${ user.id }` ,
			} ,
			{
				emoji: '👀' ,
				customId: `@curseManager/events/happySnowy:info` ,
			} ,
		) ,
	}

	context.message.channel.msg( {
		content: maybe_multiline( [
			// snowflakes
			`У вас снежинок: \`\${ curse.values.progress % SNOWFLAKES_TO_PRESENT }\` (${
				snowflakes % SNOWFLAKES_TO_PRESENT
			}/${ SNOWFLAKES_TO_PRESENT }) :snowflake:, — это не баг, здесь действительно должны быть фигурные скобки` ,
			// presents
			presentsAdded
			&& `\nПолучено из снежинок: ${ ending(
				presentsAdded ,
				'подар' ,
				'ков' ,
				'ок' ,
				'ка' ,
			) } :gift:` ,
		] ) ,
		... ( user.data.presents ? present_actions_payload : {} ) ,
	} )
}
