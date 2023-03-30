<Layout>
	<section>
		<ul>
			{#each commands as command}
			<li>
				<h2>{ command.name }</h2>
				<SvelteMarkdown source = { command.media.description.trim() }/>
				{#if command.media.poster}
					<img src = { command.media.poster } alt="poster" fetchpriority = "low" loading = "lazy">
				{/if}
			</li>
			{/each}
		</ul>
		
	</section>
	
</Layout>


<style>
	ul
	{
		display: flex;
		list-style: none;
		flex-wrap: wrap;
		gap: 30px;
	}


	li
	{
		width: min(100%, 700px);

		display: flex;
		gap: 1em;

		flex-direction: column;
		background-color: #88888811;
		flex-grow: 1;
		padding: 30px;
		border-radius: 15px;
		white-space: pre-line;
	}

	img
	{
		opacity: 0.8;
		transition: opacity 1s;
	}

	img:hover
	{
		opacity: 1;
	}
</style>

<script>
  	import { fetchFromInnerApi } from '#lib/safe-utils.js';
	import Layout from '#site-component/Layout';
  	import SvelteMarkdown from 'svelte-markdown';
	
	
	let commands = [];
	(async () => {
		const _commands = await fetchFromInnerApi("client/commands/list");
		console.log({_commands});
		commands = _commands;
	})();
</script>