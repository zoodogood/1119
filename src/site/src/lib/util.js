function relativeSiteRoot(svelteApp, path, removeHash = true){
	 const {origin, hash} = svelteApp.document.location;
	 const pathname = Object.values(svelteApp.url.base)
		 .filter(Boolean)
		 .join("/");
		 
	 return `${ origin }/${ pathname }/${ path }${ removeHash ? "" : `#${ hash }` }`;
 }

 export { relativeSiteRoot };