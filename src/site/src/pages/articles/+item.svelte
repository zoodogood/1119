
<Layout>
	{#await articlePromise}
		<h2>{ i18n.contentLoading }</h2>
	{:then data} 
		{@const source = data.content}
		<main class = "container">
			<section class = "article-info">
				<group class = "article-author">
					<img src={data.author?.avatarURL} alt="avatar">
					<span>
						<b>{ i18n.article.author }</b>
						<p>{data.author?.username ?? null}#{data.author?.discriminator ?? "0000"}</p>
					</span>
				</group>

				<group class = "article-statistic">
					<p>{ i18n.article.lastEdited } <code>{dayjs(data.timestamp).format("DD.MM.YYYY HH:mm")}</code></p>
					<p title = {`${ i18n.article.words }: ${ data.wordsCount }`}>{ i18n.article.readTime } ~{ timestampToDate(data.wordsCount * AVERAGE_PER_WORD ) }</p>
				</group>

				<group class = "article-tags">
					<p>{ i18n.article.tags }</p>
					<ul>
						<li>{ i18n.article.defaultTag }</li>
					</ul>
				</group>
			</section>

			<article class = "article-container">
				<EditableMarkdown {source}/>
			</article>

			<button class = "download-button" on:click={ downloadArticleAsMarkdown }>
				<Icon code = ""/> 
				{ i18n.downloadMarkdown }
			</button>
		</main>
		

	{:catch}
		<main class = "article-container">
			<h1>{ i18n.noResults.label }</h1>
			<p>{@html ReplaceTemplate(i18n.noResults.content, {link: PagesRouter.relativeToPage( PagesRouter.getPageBy("articles").key )}) }</p>
		</main>
	{/await}
	<section class = "comments-container">
		<Giscus tag = "article: { key ?? "void" }"/>
	</section>
</Layout>

<style>
	:global(a)
	{
		color: var( --main-color );
	}

	.container
	{
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.container::after
	{
		content: '';
		display: block;
		width: 100%;
		height: 1em;		


		opacity: 0.5;
		background: var( --main-color );
		margin-block: 1.5em;
	}


	.article-info
	{
		display: flex;
		gap: 1.5em;
		flex-wrap: wrap;

		font-size: 0.55em;
		line-height: 1;

		background-color: #88888810;
		padding: 30px;
		border-radius: 15px;

		transform: translateY(-1.5vw);
	}

	.article-author
	{
		display: flex;
		align-items: center;
		height: 2em;

		gap: 5px;
	}

	.article-statistic
	{
		flex-direction: column;
		align-items: baseline;
		justify-content: center;
	}

	.article-tags
	{
		align-items: center;
		gap: 0.5em;
	}

	.article-tags ul
	{
		list-style: none;
	}

	.article-info > *
	{
		position: relative;
		display: flex;
		margin-left: 1em;
		margin-right: 2em;
	}

	.article-info > *::before
	{
		content: '';
		position: absolute;
		left: -1.5em;
		display: inline-block;
		width: 0.5em;
		height: 0.5em;
		background-color: var( --main-color );
		opacity: 1;
		border-radius: 50%;
	}

	.article-author img 
	{
		border-radius: 50%;
		height: 100%;
		aspect-ratio: 1 / 1;
	}

	.article-container 
	{
		display: flex;
		flex-direction: column;
		width: 95%;

		min-height: 40vh;
		margin-bottom: 10vh;
		align-self: center;
	}

	.download-button
	{
		align-self: baseline;
		display: flex;
		gap: 1em;
	}
</style>

<script>
	import EditableMarkdown from '#site-component/EditableMarkdown';
	import Layout from '#site-component/Layout';
	import Giscus from '#site-component/Giscus';
	import Icon from '#site-component/iconic';
	
	import svelteApp from '#site/core/svelte-app.js';
  	import { fetchFromInnerApi, MarkdownMetadata, timestampToDate, dayjs, ReplaceTemplate } from '#lib/safe-utils.js';
  	import PagesRouter from '#site/lib/Router.js';

	const i18n = svelteApp.i18n.pages.articlesItem;
	const key = svelteApp.url.queries.id;

	const AVERAGE_PER_WORD = 60_000 / 200;
	
	const articlePromise = (async () => {
		const markdown = await fetchFromInnerApi(`site/articles/item/${ key }`);
		if (markdown === ""){
			throw new Error("Response is empty");
		}

		const {author, timestamp, tags} = MarkdownMetadata.parse(markdown) ?? {};
		const content = MarkdownMetadata.removeMetadataFieldIn(markdown);
		
		

		const wordsCount = content
			.split(" ")
			.filter(word => word.match(/[a-zа-я]/i))
			.length;


		return {
			content,
			markdown,
			author,
			timestamp,
			wordsCount,
			tags
		};
	})();

	async function downloadArticleAsMarkdown(){
		const node = document.createElement("a");
		const filename = "article.md";

		const { markdown } = await articlePromise;
		const encode = encodeURIComponent(markdown);

		node.setAttribute("href", `data:text/plain;charset=utf-8,${ encode }`);
		node.setAttribute("download", filename);

		node.click();
	}

</script>