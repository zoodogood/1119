<script>
	import ChangeLanguage from '#src/site/_build/components/svelte/ChangeLanguage/mod.svelte';
	
	
	import Layout from '#site-component/Layout'

	
	import { Theme } from '#site-component/ThemeSwitcher'
	import svelteApp from '../_build/components/app_singleton.js'
	const i18n = svelteApp.i18n.pages.public

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
