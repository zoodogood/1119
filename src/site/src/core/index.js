import {route} from '#site/core/router.js';
import svelteApp from './svelte-app.js';
import PageWrapper from '#site-component/PageWrapper';

import app from '#app';
app.svelte = svelteApp;
app.launch();

const page = route(svelteApp);
new PageWrapper({
	target: svelteApp.document.body,
	props: {
		page
	}
});
