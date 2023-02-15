
<main>
	<h1>Hello ... !</h1>
	<p>{ token }</p>
	<p>Visit the <a href={ _url }>public</a>.</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
 	import HashController from "#site/lib/HashController.js";
	import {relativeSiteRoot} from "#lib/safe-utils.js";
	import PagesEnum from "#static/build/svelte-pages/enum[builded].mjs";

	const _url = relativeSiteRoot(svelteApp, "public");

	const {code, state} = svelteApp.url.queries;
	sessionStorage.setItem("access_token", token);
</script>