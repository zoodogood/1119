
<main bind:this = {node}>
	<h1 class = "title">Привет неизвестный!</h1>
	<p class = "token">
		Ваш токен: {
			String(code)
				.split("")
				.reduce( (acc, symbol, i) => acc.concat((!i || i % 4) ? symbol : `-${ symbol }`) , "")
		}
	</p>

	<nav>

		<a href={ _redirectURL } class = "button button-to-site">
			<button>Вернуться к сайту</button>
		</a>
		
		{#if user}
			<a href={ 1 }>
				<button>Панель управления</button>
			</a>
			{:else}
			<button
				on:click={() => PagesRouter.redirect(`../oauth2/auth?redirect=${ svelteApp.url.subpath.join("/") }`)}
			>
				Войти
			</button>
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

	a
	{
		text-decoration: none;
	}

	.token
	{
		font-size: 0.9em;
		opacity: 0.5;
	}

	.button
	{
		margin-top: 3em;
		width: 15em;
	}

	nav
	{
		display: flex;
		gap: calc(2em + 1vw);
	}

	.button-to-site
	{
		filter: hue-rotate(90deg);
	}


</style>


<script>
  	import { fetchFromInnerApi, sleep, GlitchText } from "#lib/safe-utils.js";
	import svelteApp from "#site/core/svelte-app.js";
  	import PagesRouter from "#site/lib/Router.js";
	import Dialog from '#site-component/Dialog';
  	import { onMount } from "svelte";

	let node;

	const {code, redirect} = svelteApp.url.queries;
	sessionStorage.setItem("access_token", code);
	let user;

	const _redirectURL = PagesRouter.relativeToPage(
		PagesRouter.getPageBy( PagesRouter.pages[redirect] )?.key ??
		PagesRouter.getPageBy("public").key
	);

	onMount(async () => {
		if (!code){
			return;
		}

		const headers = {Authorization: code};
		const data = await fetchFromInnerApi(`./oauth2/user`, {headers});
		
		if (typeof data !== "object"){
			return;
		}

		new Dialog({
			target: svelteApp.document.body,
			props: {useClassic: true, title: "Ответ сервера:", description: JSON.stringify(data, null, 2)}
		})


		const titleNode = node.querySelector(".title");
		user = data;

		const previousContent = titleNode.textContent;
		const content = `Здравствуй, ${ user.username }!`
		const glitchText = new GlitchText(previousContent, content, {step: 3});
		for (const text of glitchText){
			await sleep(35);
			titleNode.textContent = text;
		}
		
	
		
	});
</script>