function relativeSiteRoot(app, path, removeHash = true){
	 const {origin, hash} = app.document.location;
	 const pathname = Object.values(app.url.base)
		 .filter(Boolean)
		 .join("/");
		 
	 return `${ origin }/${ pathname }/${ path }${ removeHash ? "" : `#${ hash }` }`;
 }

 export { relativeSiteRoot };