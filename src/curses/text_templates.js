export function getCursesProgressContent( curses ) {
	return curses
		.map( curse =>
			curse.values.goal
				? `・${ curse.values.progress || 0 }/${ curse.values.goal }`
				: `・${ curse.values.progress || 0 }` ,
		)
		.join( '; ' )
}
