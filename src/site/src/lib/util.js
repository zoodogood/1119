function relativeSiteRoot(svelteApp, path = "", removeQueries = true){
	const {origin, search} = svelteApp.document.location;
	const pathname = Object.values(svelteApp.url.base)
		.filter(Boolean)
		.join("/");
		
	return `${ origin }/${ pathname }/${ path }${ removeQueries ? "" : `${ search }` }`;
}

async function whenDocumentReadyStateIsComplete(document){
	return !document.readyState !== "complete" && await new Promise(resolve => 
		document.addEventListener("readystatechange", resolve, {once: true})
	);
}


export {
	relativeSiteRoot,
	whenDocumentReadyStateIsComplete
};
