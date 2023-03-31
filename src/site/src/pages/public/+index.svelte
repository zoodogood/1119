
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
</script>


<style>
	
</style>