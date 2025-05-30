<script>
	import svelteApp from "#src/site/build/compone#src/site/build/components/app_singleton.jsRoot } from "#src/site/build/compon#src/site/build/components/lib/util.jsveSiteRoot(svelteApp, "public");
	import { build } from "bun"
</script>

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

	p {
		font-size: 0.8em;
	}

	h1 {
		color: var(--main-color);
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
		overflow-wrap: normal;
	}

	a {
		color: var(--main-color);
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
