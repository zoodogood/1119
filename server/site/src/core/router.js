import * as PagesEnum from '#src/pages/exports[builded].js';



function route(app){
	
	const subpath = app.url.subpath
		.filter(subpath => !subpath.startsWith(":"))
		.join("_");


	const _Page = Object.entries(PagesEnum)
		.find(([name]) => name.toLocaleLowerCase() === subpath.toLocaleLowerCase())
		?.at(1) ?? PagesEnum.index;


	new _Page({
		target: app.document.body
	});

	
}

export { route };