<section class = "discus-container">
	<group>
		<h4>Комментарии</h4>
		<small>Идентификатор: <code>{ tag }</code></small>
	</group>
	
	<main class = "giscus">
		<p>Giscus не поддерживается</p>
	</main>
</section>



<style>
	group
	{
		align-self: baseline;
	}

	section
	{
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2em;
	}

	section::after
	{
		content: '';
		display: block;
		width: 70%;
		height: 2px;
		background-color: #88888822;
	}
</style>

<script>
	import svelteApp from '#site/core/svelte-app.js';
	import config from '#config';
  	import { onMount } from 'svelte';

	export let tag = svelteApp.document.location.href;

	const InitGiscus = () => {
		const document = svelteApp.document;
		const giscusConfig = config.giscus;


		const giscusSource = "https://giscus.app/client.js";
		const lang = svelteApp.lang;

		const themes = {
			dark: "dark",
			light: "light"
		}
		const selectedTheme = document.documentElement
			.style.getPropertyValue("--theme-accent-name") === "light"
			? themes.light : themes.dark;

		const attributes = new Map([
			["src", 							giscusSource],
			["data-repo", 					giscusConfig.repository],
			["data-repo-id", 				giscusConfig.repoId],
			["data-category", 			giscusConfig.categoryName],
			["data-category-id", 		giscusConfig.categoryId],
			["data-mapping", 				"specific"],
			["data-term",           	tag],
			["data-strict", 				"0"],
			["data-reactions-enabled", "1"],
			["data-emit-metadata", 		"0"],
			["data-input-position", 	"top"],
			["data-theme", 				selectedTheme],
			["data-lang", 					lang],
			["data-loading", 				"lazy"],
			["crossorigin", 				"anonymous"],
			["async", 						true]
		]);


		
		const node = document.createElement("script");

		attributes
			.forEach((value, name) => node.setAttribute(name, value));

		document.body.appendChild(node);
	}

	onMount(InitGiscus);
</script>