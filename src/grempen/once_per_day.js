import { singletonBotData } from '#src/data/singleton.js'
import { randomElementsFromArray } from '@zoodogood/utils/objectives'

export function update_product_list() {
	singletonBotData().grempenItems = randomElementsFromArray( [
		'0' ,
		'1' ,
		'2' ,
		'3' ,
		'4' ,
		'5' ,
		'6' ,
		'7' ,
		'8' ,
		'9' ,
		'a' ,
		'b' ,
		'c' ,
		'd' ,
		'e' ,
	] , 6 )
		.join( '' )
}
