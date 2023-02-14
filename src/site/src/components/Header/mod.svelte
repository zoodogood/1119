<header class = "page-header">
	<main class = "container">



	<section class = "label">
		<a href="./index.html" >
			<b class = "page_header-title-container-label">{ config.site.label.toUpperCase() }</b>
		</a>
	</section>

	<section class = "navigation">

		<nav>
			<a href = "pricing.html" class = "page_header-navigation-element">Главная</a>
			<a href = "" class = "page_header-navigation-element">Навигация</a>
			<a href = "" class = "page_header-navigation-element">Дискорд</a>
		</nav>

		<span class = "theme-switcher-container">
			<ThemeSwitcher/>
		</span>
	</section>
	
	  
	<section class = "authentication">
		<button
			on:click={() => PagesRouter.redirect(`../oauth2/auth?redirect=1`)}
		>
			Войти
		</button>
	</section>


	</main>
</header>

<style>
	header 
	{
		width: 100%;
		position: fixed;

		font-size: 0.8em;
	}



	.container
	{
		display: flex;
		position: relative;

		

		padding-top: 20px;
		padding-bottom: 15px;

		padding-inline: calc(2.5vw + 10px);

		align-items: center;
		justify-content: space-around;

		height: 15vh;
	}

	.label::after
	{
		content: 'Beta';
		padding: 5px;
		border-radius: 3px;
		font-size: 0.5em;
		background-color: var( --main-color );
		color: var( --white );
		margin-inline: 5px;
	}

	.label:hover
	{
		text-decoration: none;
	}

	.authentication
	{
		display: flex;
		justify-content: flex-end;
	}

	.navigation
	{
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.2em;
	}

	.navigation .theme-switcher-container
	{
		max-width: 0px;
		overflow: visible;
	}

	.label, .navigation, .authentication
	{
		flex-grow: 1;
		position: relative;
	}
</style>


<script>
   import config from '#config';
	import ThemeSwitcher from '#site-component/ThemeSwitcher';
	import svelteApp from '#site/core/svelte-app.js';
	import PagesRouter from '#site/lib/Router.js';

	

</script>