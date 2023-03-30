<Layout>
	<main>
		<h1>{ i18n.label }</h1>
		<ul class = "errors-list">
			{#each Component.errors as errorFile, i}
				{@const [day, month, hour, minute] = errorFile.name.split("-").map(number => `0${ number }`.slice(-2))}
				<li class = "error-file" class:special = { errorFile.fullname === "" } data-uniqueErrors = { errorFile.metadata?.errorsCount }>
					<a href = "{ PagesRouter.relativeToPage( PagesRouter.getPageBy("errors/list/item").key ) }/:{ errorFile.fullname }">
						<big>ID: { Component.errors.length - i }</big>
						<p>{ i18n.created } <code>{ day }.{ month }, { hour }:{ minute }</code></p>
						<br>
	
						{#if errorFile.metadata}
							<section class = "metadata-container">
								<ul>
									<li data-value = { errorFile.metadata.errorsCount ?? null }>{ i18n.uniqueMessages } { errorFile.metadata.errorsCount } { i18n.units }</li>
									<li data-value = { errorFile.metadata.uniqueTags ?? null }>{ i18n.tags } { errorFile.metadata.uniqueTags?.join(", ") }</li>
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
	
		.errors-list
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

		.error-file[data-uniqueErrors="0"]
		{
			opacity: 0.5;
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
		
		.metadata-container ul
		{
			display: flex;
			flex-direction: column;
			list-style: none;
		}

		.error-file .metadata-container li
		{
			font-size: 0.7em;
			opacity: 0.7;
		}

		.error-file .metadata-container li:not([data-value])
		{
			display: none;
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
		import PagesRouter from "#site/lib/Router.js";
		
	
		const Component = {
			errors: []
		}
		const i18n = svelteApp.i18n.pages.errorsIndex;
	
		const parseName = (fullname) => {
			const name = fullname.match(/.+?(?=\.json$)/)?.at(0);
			const [day, month, hour, minute] = name?.split("-") ?? [];
	
			const date = new Date(svelteApp.Date.getFullYear(), month - 1, day, hour, minute);
			const timestamp = date.getTime();
			return {fullname, name, timestamp};
		}
	
		(async () => {
		
		  	const {list, metadata} = await fetchFromInnerApi("errors/files");
			const errors = list
				.map(parseName);
			
			
			
			const current = {fullname: "", name: "дд-мм-чч-мм"};
			Component.errors = [current, ...errors.reverse()];
	
			for (const [name, _metadata] of Object.entries(metadata)){
				const error = errors.find(error => error.name === name);
				error.metadata = _metadata;
				error.metadata.errorsCount = _metadata.messages.length;
			}
			
		})();
	  
	</script>