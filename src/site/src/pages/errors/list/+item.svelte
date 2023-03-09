<Layout>
<main>
	<h1>Коллекция ошибок из файла:</h1>
	<p>
		Уникальных элементов:
		<span>{ Component.errors.length }</span>
	</p>

	<ul>
		{#each Component.errors as element, i}
			{@const [message, array] = element}
			<li class = "error-file">
				
					<h2>{ message }</h2>
					<section class = "tags" title = "Ключи из контекста">
						<span>Тэги:</span>
						{#each array.uniqueKeys as tag}
							<li>{ tag }</li>
						{/each}
					</section>
				
			</li>
		{/each}
	</ul>
</main>
</Layout>

<style>

	h1 
	{
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	ul
	{
		display: flex;
		flex-wrap: wrap;
		list-style: none;
		gap: 15px;
	}

	.error-file
	{
		border-radius: 15px;
		background-color: #88888811;
		width: calc(800px + 10vw);
		min-height: calc(400px + 5vw);
		flex-grow: 1;
		
		padding-inline: 1.5em;
		padding-bottom: 2em;
		font-size: 0.8em;
	}

	.tags
	{
		display: flex;
		gap: 0.5em;
	}

	.tags li 
	{
		display: inline-block;
		font-family: monospace;
		background-color: #88888844;
		cursor: pointer;
	}

	.tags li:not(:last-child)::after
	{
		content: ', ';
		position: absolute;
	}
</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
	import Layout from '#site-component/Layout';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';
	import { fly } from 'svelte/transition';
	import { parse } from 'flatted';
	

	const Component = {
		errors: []
	}

	const parseName = (fullname) => {
		const name = fullname.match(/.+?(?=\.json$)/)?.at(0);
		const [day, month, hour, minute] = name?.split("-") ?? [];

		const date = new Date(svelteApp.Date.getFullYear(), month - 1, day, hour, minute);
		const timestamp = date.getTime();
		return {fullname, name, timestamp};
	}

	(async () => {
		const URLSubpath = svelteApp.url.subpath;
		const fileName = URLSubpath.at(-1).startsWith(":") && URLSubpath.at(-1).slice(1);

		const path = fileName ? `files/${ fileName }` : "current";

  		const data = await fetchFromInnerApi(`errors/${ path }`);
		for (const [_message, array] of data){
			array.forEach(item => item.context = parse(item.context));
			const set = [...new Set(...array.map(({context}) => Object.keys(context)))];
			array.uniqueKeys = set;
		}

		console.log(data);
		Component.errors = data;
	})();
  
</script>