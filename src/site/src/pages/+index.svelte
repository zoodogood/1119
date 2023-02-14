
<main>
	<h1>Hello Bot!</h1>
	<p>Visit the <a href={_url}>public</a>.</p>
</main>

<style>
	main {
		text-align: center;
		padding: 2em;
		max-width: 240px;
		margin: 0 auto;
	}

	p 
	{
		font-size: 0.8em;
	}

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
	}

	a 
	{
		color: var( --main-color );
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
	import { relativeSiteRoot } from "#lib/safe-utils.js";
	const _url = relativeSiteRoot(svelteApp, "public");
</script>