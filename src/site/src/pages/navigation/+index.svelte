


<Layout>
	<span>
		<h1>Навигация</h1>
		<hr>
	</span>

	<main bind:this = {node} on:click = { features.handleClick } on:keydown = { features.handleClick }>


		<details open class = "table pages">
			<summary>Страницы <Icon code = ""/></summary>
			<ul>
				{#each Object.values(PagesRouter.pages) as pageKey}
					{@const url = PagesRouter.relativeToPage(pageKey)}
					<li>	
						<a href={url}>{ url.replace(config.server.origin, "") }</a>
					</li>
				{/each}
			</ul>
		</details>
		
		<details open class = "table api">
			<summary>API'шечки <Icon code = ""/></summary>
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

		<details open class = "table other">
			<summary>Другое <Icon code = ""/></summary>
			<ul>
				<li><a href={config.guild.url}>Discord server</a></li>
				<li><a href={config.enviroment.github}>Github</a></li>
				<li><a href={svelteApp.getBot().invite}>Пригласить бота</a></li>
				<li><a href="https://learn.javascript.ru/hello-world">Javascript учебник</a></li>
			</ul>
		</details>

		<details open class = "table history" style:display = {localStorage.navigationPageHistory ? null : "none"}>
			<summary>История <Icon code = ""/></summary>
			<ul>
				{#each JSON.parse(localStorage.navigationPageHistory ?? "[]").reverse() as item}
					<li>
						<a href = {item.url}>{ item.name }</a>
					</li>
				{/each}	
			</ul>
		</details>


	</main>
</Layout>





<style>
	main 
	{
		--min-table-width: 350px;
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 30px;
	}

	.table > summary
	{
		font-weight: 100;
		font-size: 1.35em;
		margin-bottom: 0.5em;

		display: flex;
		justify-content: space-between;
		cursor: pointer;
		transition: opacity 300ms;
	}

	.table > summary:hover
	{
		opacity: 0.5;
	}

	ul 
	{
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	li 
	{
		list-style: none;
		opacity: 0.8;

		font-weight: 800;
		font-family: monospace;
		width: 100%;
		display: flex;
		align-items: center;
		padding-left: 1em;

		position: relative;
	}


	li::before
	{
		content: '~';
		display: inline-block;
		width: 0.3em;
		height: 0.3em;
		color: var( --main-color );
		position: absolute;
		top: 0;
		left: 0;
		
	}

	li:hover::before
	{
		content: '[';
		opacity: 0.5;
	}

	li:hover::after
	{
		content: ']';
		display: inline-block;
		width: 0.3em;
		height: 0.3em;
		color: var( --main-color );
		position: absolute;
		top: 0;
		right: 0;
		opacity: 0.5;
	}

	li:nth-child(10n)
	{
		margin-bottom: 1em;
	}

	li a 
	{
		color: #17a3d6;
		display: inline-block;
		width: 100%;
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
		background-color: #88888810;
		padding: 15px;
		width: max-content;
		flex-grow: 1;
		font-size: 0.7em;

		min-width: min(100%, var( --min-table-width ));
		max-width: 100%;
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

	import Layout from '#site-component/Layout';	
	import Icon from '#site-component/iconic';
	import config from '#config';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';

	const whenApiListIsReceived = (async () => {
		return fetchFromInnerApi("./utils/api-list");
	})();

	let node;


	const features = {
		handleClick(pointerEvent){
			if (pointerEvent.target.nodeName !== "A"){
				return;
			}
			
			const node = pointerEvent.target;
			const url = node.getAttribute("href");
			const name = node.textContent;
			features.AddToHistory({url, name});
		},
		AddToHistory({url, name}){
			localStorage.navigationPageHistory ||= "[]";
			const history = JSON.parse(localStorage.navigationPageHistory);
			const index = history.findIndex((item) => item.name === name);
			(~index) && history.splice(index, 1);
			history.length > 10 && history.shift();
			history.push({url, name});

			localStorage.navigationPageHistory = JSON.stringify(history);
		}
	}
</script>