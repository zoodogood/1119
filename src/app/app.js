import PagesRouter from "#site/lib/Router.js";
import PagesURLs from '#static/build/svelte-pages/enum[builded].mjs';


class App {

	/** @type {Client} */
	client = null;

	server = null;

	/** @type {string} */
	version = null;

	svelte = null;

	async launch(){
		PagesRouter.resolvePages(PagesURLs);
	}
}


const app = new App();

export default app;
export {app};