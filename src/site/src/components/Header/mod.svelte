<header class = "page-header" bind:this = {Header.node} class:header--hide = { Header.isHide }>
	<main class = "container">



	<section class = "label">
		<a href="./index.html" >
			<b class = "page_header-title-container-label">{ config.site.label.toUpperCase() }</b>
		</a>
	</section>

	<section class = "navigation">

		<nav>
			<a href = { PagesRouter.relativeToPage(PagesRouter.pages.public_index) } class = "navigation-element">Главная</a>
			<a href = { PagesRouter.relativeToPage(PagesRouter.pages.navigation_index) } class = "navigation-element">Навигация</a>
			<a href = { config.guild.url } class = "navigation-element">Дискорд</a>
		</nav>

		<span class = "theme-switcher-container">
			<ThemeSwitcher/>
		</span>
	</section>
	
	  
	<section class = "authentication">
		<button
			on:click={() => PagesRouter.redirect(`../oauth2/auth?redirect=${ svelteApp.url.subpath.join("/") }`)}
		>
			Войти
		</button>
	</section>


	</main>
</header>

<svelte:window on:scroll={onScroll}/>

<style>
	header 
	{
		width: 100%;
		position: sticky;
		top: -2vh; 

		font-size: 0.8em;
		transition: top 200ms;
		backdrop-filter: blur(10px);
		z-index: 10000;
	}

	.header--hide
	{
		top: -15vh;
	}

	.container::after
	{
		content: '';
		position: absolute;
		display: block;
		width: 100%;
		height: 100%;
		z-index: -1;

		background-color: var( --background-theme-accent );
		opacity: 0.5;
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

	.navigation :global(.switch-theme){
		width: 2em;
	}

	.label, .navigation, .authentication
	{
		flex-grow: 1;
		position: relative;
	}


	.navigation 
	{
		color: var( --text-theme-accent );
		display: flex;
		justify-content: center;
	}

	.navigation-element
	{
		transition: all 300ms;
	}

	.navigation-element:hover
	{
		color: var( --main-color );
		filter: brightness(2);
	}

	.navigation nav
	{
		display: flex;
		gap: 10px;
	}






@media (max-width: 980px){
	.container
	{
		padding-top: 0;
	}

	.navigation 
	{
		position: absolute;
		bottom: 0;
	}

	.navigation nav 
	{
		gap: 20px;
		font-size: 0.8em;
	}

	.navigation-element
	{
		text-decoration: underline;
	}
}
</style>


<script>
   import config from '#config';
	import ThemeSwitcher from '#site-component/ThemeSwitcher';
	import svelteApp from '#site/core/svelte-app.js';
	import PagesRouter from '#site/lib/Router.js';

	const Header = {
		node: null,
		isHide: false
	}

	
	let scrollPosition = window.scrollY;
	function onScroll(){
		
		window.scrollY === 0 &&
			(Header.isHide = false);

		scrollPosition > window.scrollY &&
			(Header.isHide = false);

      scrollPosition < window.scrollY &&
			(Header.isHide = true);

		scrollPosition = window.scrollY;
	}
	
</script>