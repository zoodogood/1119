import { entriesFromGroupBy , entriesMapKey } from '#root/src/safe-utils.js'

export const ChangelogItemMarkers = [
	{ label: 'Fix' , symbol: '#' , alias: [ 'fix' , 'bug' ] } ,
	{
		label: 'Balance change' ,
		symbol: '$' ,
		alias: [ 'balance' , 'balance change' ] ,
	} ,
	{
		label: 'Major' ,
		symbol: '!' ,
		alias: [ 'major' , 'important' ] ,
	} ,
	{ label: 'Add feature' , symbol: '+' , alias: [ 'add feature' , 'feature' ] } ,
	{ label: 'Improve' , symbol: '%' , alias: [ 'improve' ] } ,
	{ label: 'Another' , symbol: '/' , alias: [] } ,
]

export function group_changes_by_default( flat_with_metadata ) {
	return group_changes_by_periods( flat_with_metadata ).map(
		( [ period , changes ] ) => [ period , group_changes_by_group_symbol( changes ) ] ,
	)
}

function group_changes_by_periods( flat_with_metadata ) {
	return entriesFromGroupBy(
		flat_with_metadata ,
		( { period } ) => period ,
	).toReversed()
}

export function group_changes_by_group_symbol( flat_with_metadata ) {
	return entriesMapKey(
		entriesFromGroupBy(
			flat_with_metadata ,
			$ => $.group_symbol ,
		) ,
		$ => ChangelogItemMarkers.find( ( { symbol } ) => symbol === $ ) ,
	)
}

export function change_to_string( { group_symbol , short_change } ) {
	return `\`${ group_symbol }\` ${ short_change }`
}
