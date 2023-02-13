import {route} from '#site/core/router.js';
import SvelteApp from './app.js';

import app from '#app';

app.svelte = SvelteApp;

route(SvelteApp);
