
<main>
	<h1>Hello 1119!</h1>
	<p>Visit the <a href={_url}>public</a>.</p>
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
	import app from "#site/core/app.js";
	import { relativeSiteRoot } from "#lib/safe-utils.js";
	const _url = relativeSiteRoot(app, "public");
</script>