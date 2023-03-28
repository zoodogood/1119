
<Layout>
	<group>
		<h1>{ i18n.label }</h1>
		<p>{ i18n.description }</p>
	</group>
	
	<section class = "article-create">
		<h3>{ i18n.createInfo.label }</h3>
		<p>{@html ReplaceTemplate(i18n.createInfo.content, {href: PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/create").key)}) }</p>
	</section>

	<section class = "articles-list">
		<h3>{ i18n.articlesList.label }</h3>
		<p>{ i18n.articlesList.filesCount } { articlesPromise.filesCount ?? 0 }</p>
		{#await articlesPromise}
			<p>{ i18n.articlesList.loading }</p>
		{:then data}
			{@const list = data.filter(Search.filter)}
			<input type="text" placeholder = " Фильтровать" bind:value = { Search.value }>
			<ul>
				{#if list.length}
					{#each list as key}
						{@const href = `${ PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/item").key) }?id=${ key }`}
						<a {href}><li>{ key }</li></a>
					{/each}
				{:else}
					<p>{ i18n.articlesList.hereEmpty }</p>
				{/if}
			</ul>
		{:catch}
			<p>{ i18n.articlesList.loadingFailed }</p>
		{/await}
	</section>
</Layout>


<style>
	a
	{
		color: var( --main-color );
	}

	.articles-list ul
	{
		display: flex;
		flex-wrap: wrap;
		gap: 30px;
		margin-top: 1em;
	}

	.articles-list li
	{
		display: block;
		background-color: #88888822;
		min-width: 300px;
		height: 200px;
		border-radius: 15px;
		padding: 20px;
		padding-right: 1.5em;
		animation: article-apparance 1s;
		color: var( --text-theme-accent );
	}

	.articles-list a
	{
		text-decoration: none;
	}

	@keyframes article-apparance
	{
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	input 
	{
		font-family: 'Icon', sans-serif;
		font-weight: 100;
		margin-top: 1em;
	}
</style>

<script>
	import Layout from '#site-component/Layout';
	import PagesRouter from '#site/lib/Router.js';
  	import { fetchFromInnerApi, ReplaceTemplate } from '#lib/safe-utils.js';

	const i18n = svelteApp.i18n.pages.articlesIndex;
	const articlesPromise = (async () => {
		return fetchFromInnerApi("site/articles");
	})();

	articlesPromise
		.then(data => articlesPromise.filesCount = data.length);

	
	const Search = {
		value: "",
		filter(name){
			return name.includes(Search.value);
		}
	}

</script>