
<Header/>

<Main>
	<span>
		<h1>Навигация</h1>
		<hr>
	</span>

	<section>


		<details open>
			<summary>Страницы</summary>
			<ul>
				{#each Object.values(PagesRouter.pages) as pageKey}
					{@const url = PagesRouter.relativeToPage(pageKey)}
					<li>	
						<a href={url}>{ url.replace(config.server.origin, "") }</a>
					</li>
				{/each}
			</ul>
		</details>
		
		<details open>
			<summary>API'шечки</summary>
			Пока здесь пусто ;)
		</details>


	</section>
</Main>

<Footer/>

<script>
	console.info({pages: PagesRouter.pages});
	import PagesRouter from '#site/lib/Router.js';
	
	import Header from '#site-component/Header';
	import Main from '#site-component/Main';	
	import Footer from '#site-component/Footer';
  	import config from '#config';
</script>

<style>
	section 
	{
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 30px;
	}

	summary
	{
		font-weight: 100;
	}

	li 
	{
		font-size: 0.7em;
		list-style: inside;
		color: #17a3d6;
		opacity: 0.8;

		font-weight: 800;
	}

	details
	{
		border-radius: 15px;
		background-color: #88888822;
		padding: 15px;
		width: max-content;
		min-width: 300px;
		
	}

	details:not([open])
	{
		align-self: flex-start;
	}
</style>