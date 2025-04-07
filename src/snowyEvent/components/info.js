import { maybe_multiline } from '#src/safe-utils.js'

export default function info( { interaction } ) {
	interaction.msg( {
		ephemeral: true ,
		image:
			'https://cdn.discordapp.com/attachments/926144032785195059/1180876446672101446/4075c2de34d3e71e0967971d70805b0555ad82327810079.png?ex=657f03e4&is=656c8ee4&hm=7cab7a87e37056aa01819b79c61552630240ef877d52ab2f4e79e8dca4760db3&' ,
		description: maybe_multiline( [
			'Время собрать весь снег и передать его снеговику :snowman:\n' ,
			`А после залезть: из коробки кричать "ура!" :star2:\n` ,
			`Вытряхнув всякую мелочь: сверкающие камни и сундуки;\n` ,
			`Обнаружьте два эксклюзивных предмета;\n` ,
			`И услышьте цитату из интернета,\n` ,
			'\n' ,
			'— откройте коробку сейчас или подарите другу!\n' ,
			'Пусть тоже залезет\n' ,
		] ) ,
	} )
}
