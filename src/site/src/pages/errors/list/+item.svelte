<Layout>
<main>
	<h1>{ i18n.label }</h1>
	
	<p>
		{ i18n.uniqueCount }
		<span>{ Component.errors.length }</span>
	</p>
	<a class = "collections-link" href = { PagesRouter.relativeToPage( PagesRouter.getPageBy("errors/list").key ) }><Icon code = ""/> { i18n.backToCollections }</a>
	{#if Component.errors.length}
		<input type="text" placeholder = " { i18n.filter }" bind:value = { Search.value } title = { i18n.filterTip }>
	{/if}

	<ul class = "errors">
		{#each Component.errors.filter(Search.filter) as element, i}
			{@const [message, array] = element}
			<li class = "error-file" id = { message }>
				
					<h2>{ message }</h2>
					<section class = "tags">
						<span>{ i18n.tags }</span>
						<ul on:click = {Search.tagClickHandler} on:keydown = {() => {}}>
							{#each array.uniqueKeys as tag}
								<li>{ tag }</li>
							{/each}
						</ul>;
					</section>
					<p>
						<span>{ i18n.called }</span>
						{ ending(array.length, "раз", "", "", "а") };
					</p>
					
					<details class = "error-details">
						<summary>{ i18n.details }</summary>
						{#each array as arrayErrorElement, i}
							<details class = "arrayErrorElement">
								<summary>{ i18n.element } #{ i + 1 } ({ dayjs(arrayErrorElement.timestamp).format("HH:mm") })</summary>
								<h3>{ i18n.context }</h3>
								<code class = "context">
									{ yaml.stringify(arrayErrorElement.context) }
								</code>
								<h3>{ i18n.stack }</h3>
								<code class = "stack">
									{arrayErrorElement.stack}
								</code>
							</details>
						{/each}
					</details>
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


	input 
	{
		font-family: 'Icon', sans-serif;
		font-weight: 100;
		margin-top: 1em;
	}

	.collections-link 
	{
		font-size: 0.5em;
		display: block;
	}

	.errors
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

		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.error-details
	{
		margin-top: auto;
		padding-top: 3em;
	}

	.tags ul
	{
		display: inline-flex;
		gap: 1em;
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


	details > summary
	{
		list-style-type: '';
		cursor: pointer;
	}

	details > summary::before
	{
		content: '';
		font-family: 'Icon';
		display: inline-block;
		transition: transform 300ms;
		transform: rotate(90deg);

		opacity: 0.5;
		margin: 1vw;

		width: 1vw;
	}

	details[open] > summary::before
	{
		transform: rotate(180deg);
	}

	.stack, .context
	{
		font-size: 0.65em;
		padding: 1em;
		width: 100%;
		white-space: pre;
		border-radius: 5px;
	}

	.arrayErrorElement
	{
		font-size: 0.8em;
	}

	
</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
	import Layout from '#site-component/Layout';
	import Icon from '#site-component/iconic';

	import { dayjs, ending, fetchFromInnerApi, yaml } from '#lib/safe-utils.js';
	import { fly } from 'svelte/transition';
	import { parse } from 'flatted';
  	import PagesRouter from "#site/lib/Router.js";
	
	const i18n = svelteApp.i18n.pages.errorsItem;

	const Component = {
		errors: []
	}

	const Search = {
		filter([message, errorsArray]){
			if (!Search.value){
				return true;
			}
			const blacklist = [];
			const whitelist = [];
			
			Search.value.split(" ").forEach(word => 
				word.startsWith("!") ? blacklist.push(word.slice(1)) : whitelist.push(word)
			);

			const isIncludes = (list) => list.every(word => 
				message.includes(word) ||
				errorsArray.uniqueKeys.some(tag => tag.includes(word))
			);
			
			return isIncludes(whitelist) && (!blacklist.length || !isIncludes(blacklist));
		},
		tagClickHandler(clickEvent){
			if (clickEvent.target.tagName !== "LI"){
				return;
			}

			const value = clickEvent.target.textContent;
			Search.value = Search.value.includes(value) ?
				Search.value.replace(value, `!${ value }`) :
				`${ Search.value } ${ value }`;
		},
		value: ""
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
			array.forEach(item => {
				item.context = item.context && parse(item.context) || {};
				item.stack = decodeURI(item.stack).replaceAll("\\", "/");
			});
			const set = [...new Set(...array.map(({context}) => Object.keys(context)))];
			array.uniqueKeys = set;
		}

		console.log({data});
		Component.errors = data;
	})();
  
</script>