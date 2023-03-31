<Notifications>
	<svelte:component this = { page }/>
</Notifications>



<MetaTags
	title = { i18n.title }
	{languageAlternates}
	canonical = { relativeSiteRoot(svelteApp) }
	additionalMetaTags = {[
		{
			name: "theme-color",
			content: Theme.collection.get(Theme.current)["--main-color"]
		}
	]}
/>

<script>
	export let page;

	
	import Notifications from '#site-component-lib/Notifications/wrap.svelte';
	import { MetaTags } from 'svelte-meta-tags';
	
	import svelteApp from '#site/core/svelte-app.js';
  	import config from '#config';
  	import { relativeSiteRoot } from '#lib/safe-utils.js';
	import { Theme } from '#site-component/ThemeSwitcher';
	

	const _currentURLLang = svelteApp.url.base.lang;
	const languageAlternates = config.i18n.availableLanguages
		.map(locale => {
			svelteApp.url.base.lang = locale;
			const href = relativeSiteRoot(svelteApp, svelteApp.url.subpath.join("/"));
			return {hrefLang: locale, href};
		});

	svelteApp.url.base.lang = _currentURLLang;


	const i18n = svelteApp.i18n.general;
	document.documentElement.setAttribute("lang", svelteApp.lang);
</script>

