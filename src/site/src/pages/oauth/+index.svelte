
<main>
	<h1>Привет неизвестный!</h1>
	<p class = "token">Ваш токен: { String(code).split("").reduce((acc, symbol, i) => acc.concat((!i || i % 4) ? symbol : `-${ symbol }`), "") }</p>

	<nav>

		<a href={ _redirectURL } class = "button-to-site">
			<button>Вернуться к сайту</button>
		</a>
		
		{#if code}
			<a href={ 1 }>
				<button>Панель управления</button>
			</a>
			{:else}
			<a href={ 1 }>
				<button>Войти</button>
			</a>
		{/if}
		

	</nav>
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

	nav
	{
		display: flex;
		gap: 2em;
	}

	.button-to-site
	{
		filter: hue-rotate(90deg);
	}

</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
 	import HashController from "#site/lib/HashController.js";
	import {relativeSiteRoot} from "#lib/safe-utils.js";
	import PagesEnum from "#static/build/svelte-pages/enum[builded].mjs";
  	import PagesRouter from "#site/lib/Router.js";

	

	const {code, redirect} = svelteApp.url.queries;
	sessionStorage.setItem("access_token", code);

	let _redirectURL = PagesRouter.relativeToPage(
		PagesRouter.getPageBy( PagesRouter.pages[redirect] )?.key ??
		PagesRouter.getPageBy("public").key
	);
</script>