
<main>
	<h1>Привет неизвестный!</h1>
	<p class = "token">Ваш токен: { String(code).split("").reduce((acc, symbol, i) => acc.concat((!i || i % 4) ? symbol : `-${ symbol }`), "") }</p>
	<a href={PagesRouter.relativeToPage(PagesRouter.pages[state] ?? PagesRouter.pages.public)}>
		<button>Вернуться к сайту</button>
	</a>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;

		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
	}

	.token
	{
		font-size: 0.9em;
		opacity: 0.5;
	}

	button
	{
		margin-top: 3em;
	}
</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
 	import HashController from "#site/lib/HashController.js";
	import {relativeSiteRoot} from "#lib/safe-utils.js";
	import PagesEnum from "#static/build/svelte-pages/enum[builded].mjs";
  	import PagesRouter from "#site/lib/Router.js";

	const _url = relativeSiteRoot(svelteApp, "public");

	const {code, state} = svelteApp.url.queries;
	sessionStorage.setItem("access_token", code);
</script>