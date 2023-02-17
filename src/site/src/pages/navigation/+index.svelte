
<Header/>

<Main>
	<span>
		<h1>Навигация</h1>
		<hr>
	</span>

	<main>


		<details open class = "table">
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
		
		<details open class = "table">
			<summary>API'шечки</summary>
			<details open>
				<summary><b>Простые пути:</b></summary>
				<p>
					<small>Данные из точки зачастую можно получить напрямую.</small>
				</p>
				{#await whenApiListIsReceived}
					<p>Загрузка...</p>
				{:then data} 
					<ul>
						{#each data.filter(route => route.isSimple && route.methods.includes("get")) as route}
							{@const url = config.server.origin.concat(route.prefix)}
							<li>
								<a href={url}>{route.prefix}</a>
							</li>
						{/each}	
					</ul>
				{:catch}
					<p>Сервер недоступен</p>
				{/await}
				
			</details>
			

			<details>
				<summary><b>Особые пути:</b></summary>
				<p>
					<small>Опциональны, иногда, требуется аунтефикация или другие действия.</small>
				</p>
				{#await whenApiListIsReceived}
					<p>Загрузка...</p>
				{:then data} 
					<ul>
						{#each data.filter(route => route.methods.length && !route.isRegex) as route}
							{#each route.methods as method}
								<li><code>{ method.toUpperCase() }</code> <span>{ route.prefix }</span></li>
							{/each}
						{/each}	
					</ul>
				{:catch}
					<p>Сервер недоступен</p>
				{/await}
			</details>
			

			<details>
				<summary><b>Регулярные выражения:</b></summary>
				<p>
					<small>Не имеют чёткого адреса.</small>
				</p>
				<ul>
					{#await whenApiListIsReceived}
						<p>Загрузка...</p>
					{:then data} 
						<ul>
							{#each data.filter(route => route.isRegex) as route}
								<li>
									<span>{ route.prefix }</span>
								</li>
							{/each}	
						</ul>
					{:catch}
						<p>Сервер недоступен</p>
					{/await}
				</ul>
				
			</details>
			
			
		</details>

		<details open class = "table">
			<summary>Другое</summary>
			<ul>
				<li><a href={config.guild.url}>Discord server</a></li>
				<li><a href={config.enviroment.github}>Github</a></li>
				<li><a href={svelteApp.getBot().invite}>Пригласить бота</a></li>
				<li><a href="https://learn.javascript.ru/hello-world">Javascript учебник</a></li>
			</ul>
		</details>


	</main>
</Main>

<Footer/>



<style>
	main 
	{
		--min-table-width: 300px;
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 30px;
	}

	.table > summary
	{
		font-weight: 100;
		font-size: 1.5em;
		margin-bottom: 0.5em;
	}

	ul 
	{
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	li 
	{
		list-style: inside;
		opacity: 0.8;

		font-weight: 800;
		font-family: monospace;
	}


	li:nth-child(10n)::after
	{
		content: '';
		display: block;
		height: 1em;
		overflow: hidden;
	}

	li a 
	{
		color: #17a3d6;
		display: inline-block;
		width: var( --min-table-width );
	}

	li a:hover
	{
		background-color: #88888811;
	}

	

	li span
	{
		color: var( --text-theme-accent );
	}

	.table
	{
		border-radius: 15px;
		background-color: #88888822;
		padding: 15px;
		width: max-content;
		flex-grow: 1;
		font-size: 0.7em;
	}

	.table:not([open])
	{
		align-self: flex-start;
	}

	details[open]
	{
		padding-bottom: 30px;
	}

	.table p 
	{
		max-width: var( --min-table-width );
	}

	.table small 
	{
		opacity: 0.7;
	}
</style>




<script>
	import svelteApp from '#site/core/svelte-app.js';
	import PagesRouter from '#site/lib/Router.js';

	import Header from '#site-component/Header';
	import Main from '#site-component/Main';	
	import Footer from '#site-component/Footer';
	import config from '#config';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';

	const whenApiListIsReceived = (async () => {
		return fetchFromInnerApi("./utils/api-list");
	})();
</script>