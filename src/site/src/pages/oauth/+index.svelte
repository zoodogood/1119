
<main bind:this = {node}>
	<h1 class = "title">Привет неизвестный!</h1>
	<p class = "token">
		Ваш токен: {
			String(State.code)
				.split("")
				.reduce( (acc, symbol, i) => acc.concat((!i || i % 4) ? symbol : `-${ symbol }`) , "")
		}
	</p>

	<nav>

		<a href={ _redirectURL } class = "button button-to-site">
			<button>Вернуться к сайту</button>
		</a>
		
		{#if State.status & (StatusEnum.dataSuccess | StatusEnum.dataPending)}
			<a href= {PagesRouter.relativeToPage( PagesRouter.getPageBy("user/panel").key )} class = "button-to-panel">
				<button disabled = {State.status === StatusEnum.dataPending}>Панель управления</button>
			</a>
			{:else}
			<button
				on:click={() => PagesRouter.redirect(`../oauth2/auth?redirect=${ svelteApp.url.subpath.join("/") }`)}
			>
				Войти
			</button>
		{/if}
		

	</nav>

	{#if State.status === StatusEnum.dataSuccess}
		<p class = "tip">Теперь вы можете покинуть эту страницу</p>
	{/if}

</main>



<style>
	
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;

		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 100%;
		overflow: hidden;

		justify-content: center;
		height: 100vh;
		padding-bottom: 20vh;

		font-size: 0.9em;
	}

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 2em;
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

	

	nav
	{
		display: flex;
		gap: calc(2em + 1vw);
		margin-top: 10vh;
	}

	button
	{
		width: 15em;
	}

	.button-to-site
	{
		filter: hue-rotate(90deg);
	}


	.tip 
	{
		position: fixed;
		bottom: 3em;
		font-size: 0.7em;
		opacity: 0.5;
	}

</style>


<script>
  	import { fetchFromInnerApi, sleep, GlitchText } from "#lib/safe-utils.js";
	import svelteApp from "#site/core/svelte-app.js";
  	import PagesRouter from "#site/lib/Router.js";
  	import { onMount } from "svelte";
	

	let node;




	let {code, redirect} = svelteApp.url.queries;
	code ||= svelteApp.storage.getToken();
	
	svelteApp.storage.setToken(code);


	let user;

	const _redirectURL = PagesRouter.relativeToPage(
		PagesRouter.getPageBy( PagesRouter.pages[redirect] )?.key ??
		PagesRouter.getPageBy("public").key
	);


	const StatusEnum = {
		noToken: 1,
		dataPending: 2,
		dataSuccess: 4,
		dataReject: 8
	}

	const State = {
		status: code ? StatusEnum.dataPending : StatusEnum.noToken,
		code,
		redirect
	}
	
	async function realizeDataByToken(code){
		if (!code){
			return;
		}
		

		const headers = {Authorization: code};
		const data = await fetchFromInnerApi(`./oauth2/user`, {headers});
			
		if (typeof data !== "object"){
			return;
		}


		const titleNode = node.querySelector(".title");
		user = data;
		svelteApp.storage.setUserData(user);
		svelteApp.user = svelteApp.storage.getUserData();

		const previousContent = titleNode.textContent;
		const content = `Здравствуй, ${ user.username }!`
		const glitchText = new GlitchText(previousContent, content, {step: 2});
		for (const text of glitchText){
			await sleep(25);
			titleNode.textContent = text;
		}

		return user;
	}


	

	onMount(async () => {
		const user = await realizeDataByToken(code);
		State.status = user?.id ? StatusEnum.dataSuccess : StatusEnum.dataReject
	});


</script>