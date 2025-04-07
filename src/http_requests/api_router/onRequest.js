import DataManager from '#src/data/DataManager.js'

export function onRequest( request , response , next ) {
	incrementEnterAPIStatistic( request , response )
	next()
}

function incrementEnterAPIStatistic( request , response ) {
	let subpath = request.path.split( '/' ).filter( Boolean ).join( '/' )

	if ( subpath.startsWith( 'public' ) ) {
		subpath = 'public'
	}

	const siteData = DataManager.data.site

	siteData.enterToAPI[ subpath ] ||= 0
	siteData.enterToAPI[ subpath ]++
	siteData.entersToAPI++
	siteData.entersToAPIToday++
}
