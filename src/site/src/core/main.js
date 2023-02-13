import {route} from '#site/core/router.js';
import svelteApp from './svelte-app.js';

import app from '#app';

app.svelte = svelteApp;

route(svelteApp);
