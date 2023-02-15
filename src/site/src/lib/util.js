function relativeSiteRoot(svelteApp, path, removeQueries = true){
	 const {origin, search} = svelteApp.document.location;
	 const pathname = Object.values(svelteApp.url.base)
		 .filter(Boolean)
		 .join("/");
		 
	 return `${ origin }/${ pathname }/${ path }${ removeQueries ? "" : `${ search }` }`;
 }

 export { relativeSiteRoot };