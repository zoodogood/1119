import { LazySort } from '@zoodogood/utils/objectives'
import { assert } from './assert/export.js'

export function mediana_of_unsorted( array ) {
	assert( array.length > 0 )
	return LazySort.ofNumbers( array )
		.entry()
		.at( Math.round( array.length / 2 ) )[ 0 ]
}
