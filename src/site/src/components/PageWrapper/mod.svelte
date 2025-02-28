<script>
	import Notifications from "#site-component-lib/Notifications/wrap.svelte";
	import { PopupsHandler } from "#site-component-lib/Popups/index.js";
	import { MetaTags } from "svelte-meta-tags";

	import config from "#config";
	import { Theme } from "#site-component/ThemeSwitcher";
	import svelteApp from "#site/core/svelte-app_singleton.js";
	import { relativeSiteRoot } from "#site/lib/util.js";
	import { writeError } from "#site/lib/writeErrorToServer.js";
	import { onMount } from "svelte";
	import { get as getStoreValue } from "svelte/store";
	const { page } = $props();
	const _currentURLLang = svelteApp.url.base.lang;
	const languageAlternates = config.i18n.availableLanguages.map((locale) => {
		svelteApp.url.base.lang = locale;
		const href = relativeSiteRoot(svelteApp, svelteApp.url.subpath.join("/"));
		return { hrefLang: locale, href };
	});

	svelteApp.url.base.lang = _currentURLLang;

	const i18n = svelteApp.i18n.general;
	document.documentElement.setAttribute("lang", svelteApp.lang);

	onMount(() => {
		addEventListener("unhandledrejection", async (event) => {
			const { reason } = event;
			writeError(reason);
		});

		addEventListener("error", (event) => {
			writeError(event);
		});
	});
</script>

<Notifications>
	<svelte:component this={page} />
</Notifications>
<PopupsHandler />

<MetaTags
	title={i18n.title}
	{languageAlternates}
	canonical={relativeSiteRoot(svelteApp)}
	additionalMetaTags={[
		{
			name: "theme-color",
			content: Theme.collection.get(getStoreValue(Theme.current))[
				"--main-color"
			],
		},
	]}
/>
