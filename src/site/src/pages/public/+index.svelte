{#if $CurrentThemeStore === Theme.enum.brightOrange}
	<style>
		body {
			background: url('https://cdn.discordapp.com/attachments/629546680840093696/1091416746684063824/autumn.png') var( --background-theme-accent );
			background-size: min(100vmax, 200vw);
			background-repeat: no-repeat;
		}
	</style>
{/if}


<Layout>
	<h1>{ i18n.hi }</h1>
	<p>{ i18n.cool }</p>
	<ChangeLanguage/>
</Layout>

<script>
	import Layout from '#site-component/Layout';
	import ChangeLanguage from '#site-component/ChangeLanguage';
	import svelteApp from '#site/core/svelte-app.js';
	const i18n = svelteApp.i18n.pages.public;

	import { Theme } from '#site-component/ThemeSwitcher';
	const CurrentThemeStore = Theme.current;
</script>


<style>
	
</style>