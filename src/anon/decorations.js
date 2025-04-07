import { randomWith } from '#src/safe-utils.js'

class Stages {
	processMonkeyPaschal( context ) {
		if ( context.auditor.length < 10 ) {
			return
		}

		const MONKEY_TO_SPACE
			= 'https://media.discordapp.net/attachments/629546680840093696/1166087241932755138/monkeytospace.png?ex=6549365f&is=6536c15f&hm=c17fde1d51c7d9323deeddaaf6d1cd74af723b05d47144122ac49766a5a05691&='
		const MONKEY_HAPPY
			= 'https://media.discordapp.net/attachments/629546680840093696/1166087575098892288/IMG_20230808_151010.jpg?ex=654936ae&is=6536c1ae&hm=1ec0785014ab36c96deead92bbe572d090d4cfa3066e2c6e7372be33379d7154&=&width=876&height=657'

		const url = randomWith( 20 ) ? MONKEY_TO_SPACE : MONKEY_HAPPY
		context.interaction.channel.msg( { content: url } )
	}

	stageCodename( stageIndex ) {
		return (
			[
				'Джунгли' ,
				'Степь' ,
				'Пески' ,
				'Обитель' ,
				'База' ,
				'Побережье' ,
				'Станция' ,
				'Применение\nдрайвера' ,
				'Запуск\nРакеты' ,
				'Космос' ,
			].at( stageIndex ) ?? 'Отпечаток'
		)
	}
}
