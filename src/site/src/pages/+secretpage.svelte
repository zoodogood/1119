

<main>
	<p>{ i18n.label }</p>
	<small>{ i18n.future }</small>
</main>


<nav class = "theme-switcher-container">
	<a href = {PagesRouter.relativeToPage(PagesRouter.getPageBy("public").key)}><Icon code = ""/></a>
	<ThemeSwitcher/>
</nav>



<style>
	main 
	{
		--angle: 275deg;
		--color: #ddffdd88;

		text-transform: uppercase;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 100vh;
		min-height: 100svh;
		padding-bottom: 20vh;
		gap: 0.2em;

		text-align: center;

		background-image: conic-gradient(
			#00000000, 
			var(--main-color) 360deg
		)
	}


	main::after
	{
		content: '';
		position: absolute;
		width: 100%;
		height: 100%;

		background-image: conic-gradient(
			#00000000 var( --angle ), 
			color-mix(in srgb, var( --color ), var(--main-color)) 0
		);
		

		
		filter: blur(2px);
		z-index: -1;
	}
	

	small
	{
		opacity: 0.3;
		user-select: none;
		font-size: 0.3em;	
	}

	nav
	{
		position: fixed;
		right: 1vw;
		top: 1vw;
		opacity: 0.5;

		display: flex;
		gap: 1vw;
	}
</style>


<script>
	import ThemeSwitcher from '#site-component/ThemeSwitcher';
	import Icon from '#site-component/iconic';
	import PagesRouter from '#site/lib/Router.js';
  	import svelteApp from '#site/core/svelte-app.js';

	const i18n = svelteApp.i18n.pages.secretpage;
</script>