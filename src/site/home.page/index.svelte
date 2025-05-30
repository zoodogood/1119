<script>
	import ChangeLanguage from '#src/site/build/components/svelte/ChangeLanguage/mod.svelte';
	
	
	import Layout from '#site-component/Layout'

	
	import { Theme } from '#site-component/ThemeSwitcher'
	import svelteApp from '../build/compon../build/components/app_singleton.jssvelteApp.i18n.pages.public
	import { i18n } from '#src/i18n/singleton.js'

	const CurrentThemeStore = Theme.current
</script>


{#if $CurrentThemeStore === Theme.enum.brightOrange}
	<style>
		body {
			background: url("https://i.ibb.co/XbPmgfh/autumn.webp")
				var(--background-theme-accent);
			background-size: contain;
			background-repeat: no-repeat;
		}
	</style>
{/if}

<Layout>
	<h1>{i18n.hi}</h1>
	<p>{i18n.cool}</p>
	<ChangeLanguage />
</Layout>

<style>
</style>
