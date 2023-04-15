{#if isVisible}
<section>
	<ul>
	{#each languages as locale}
		<li title = {"Выбери меня"}>
			<button on:click = {onClick}>{ locale }</button>
		</li>
	{/each}
	</ul>
</section>
{/if}

<style>
	ul
	{
		display: flex;
		list-style: none;

	}
	button
	{
		text-transform: uppercase;
		display: inline;
		background: none;
		font-family: monospace;
		padding: 0.5em;
		min-width: 20px;
		color: inherit;
	}

	button:hover
	{
		background-color: #88888822;
		text-decoration: underline;
	}
</style>

<script>	
	export let isAlwaysVisible = false;

  	import config from "#config";
  	import { relativeSiteRoot } from "#lib/safe-utils.js";
  	import svelteApp from "#site/core/svelte-app.js";
	
	let isVisible = !svelteApp.storage.getSelectedLocale() || isAlwaysVisible;
	const languages = config.i18n.availableLanguages;

	function onClick(){
		const locale = this.textContent.toLowerCase();
		svelteApp.lang = locale;
		svelteApp.url.base.lang = locale;

		const path = svelteApp.url.subpath.join("/");
		svelteApp.document.location.href = relativeSiteRoot(svelteApp, path, false);
	}
</script>