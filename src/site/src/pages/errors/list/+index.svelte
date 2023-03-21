<Layout>
	<main>
		<h1>Комплекты ошибок:</h1>
		<ul>
			{#each Component.errors as errorFile, i}
				{@const [day, month, hour, minute] = errorFile.name.split("-").map(number => `0${ number }`.slice(-2))}
				<li class = "error-file" class:special = { errorFile.fullname === "" }>
					<a href = "{ PagesRouter.relativeToPage( PagesRouter.getPageBy("errors/list/item").key ) }/:{ errorFile.fullname }">
						<big>ID: { Component.errors.length - i }</big>
						<p>Создано: <code>{ day }.{ month }, { hour }:{ minute }</code></p>
						<br>
	
						{#if errorFile.metadata}
							<section class = "metadata-container">
								<ul>
									<li>Уникальных сообщений: { errorFile.metadata.errors }шт.</li>
									<li>Теги: { errorFile.metadata.tags.join(" ") }</li>
								</ul>
							</section>
						{/if}
					</a>
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
			width: calc(400px + 5vw);
			height: calc(300px + 3vw);
			flex-grow: 1;
			
	
			font-size: 0.8em;
			position: relative;
		}
	
		.error-file a 
		{
			widows: 100%;
			height: 100%;
			padding: 0.5em;
			display: block;
			cursor: pointer;
			color: var( --text-theme-accent );
			text-decoration: none;
		}
	
		.error-file:hover
		{
			background-color: #88888844;
		}
	
		.error-file .metadata-container li
		{
			font-size: 0.7em;
			opacity: 0.7;
		}
		
		.error-file.special big::before
		{
			content: '';
			font-family: 'Icon';
			float: right;
			display: block;
			width: 1em;
			
			right: 1em;
			top: 0.5em;
			font-size: 1.2em;
			opacity: 0.3;
		}

	</style>
	
	
	<script>
		import svelteApp from "#site/core/svelte-app.js";
		import Layout from '#site-component/Layout';
		import { fetchFromInnerApi } from '#lib/safe-utils.js';
		import { whenDocumentReadyStateIsComplete } from "#site/lib/util.js";
		import PagesRouter from "#site/lib/Router.js";
		
	
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
		
		  	const data = await fetchFromInnerApi("errors/files");
	
			const errors = data
				.map(parseName);
	
			
			const current = {fullname: "", name: "дд-мм-чч-мм"};
			Component.errors = [current, ...errors.reverse()];
	
			await whenDocumentReadyStateIsComplete(svelteApp.document);


			
		})();
	  
	</script>