import * as PagesEnum from '#src/pages/exports.js';



function route(app){
	
	const context = {
		pageName: null,
		current: null
	};


	app.Hash.store.subscribe(({page}) => {
		page ||= "";

		if (page === context.pageName){
			return;
		}

		context.current?.$destroy();

		const Page = Object.entries(PagesEnum)
			.find(([name]) => name.toLocaleLowerCase() === page.toLocaleLowerCase())
			?.at(1) ?? PagesEnum.Welcome;


		context.current = new Page({
			target: app.document.body
		});
	});
}

export { route };