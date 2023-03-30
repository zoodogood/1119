<Layout>
	<section>
		<ul>
			{#each commands as command}
			<li>
				<h2>{ command.name }</h2>
				<span class = "type">{ CategoryEnum[ command.type ]}</span>
				<EditableMarkdown source = { command.media.description.trim() }/>
				{#if command.media.poster}
					<img src = { command.media.poster } alt="poster" fetchpriority = "low" loading = "lazy">
				{/if}
				<h6>
					{#each command.allias.split(" ") as allias}
						<span>!{ allias }</span>
					{/each}
				</h6>
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
		width: min(100%, 1000px);

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

	.type 
	{
		background-color: #88888811;
		display: inline-block;
		width: fit-content;
		padding: 0.2em;
	}

	h6
	{
		margin-top: auto;
		opacity: 0.65;
		display: flex;
		gap: 0.5em;
		font-weight: 0.5em;
		flex-wrap: wrap;
	}
</style>

<script>
  	import { fetchFromInnerApi } from '#lib/safe-utils.js';
	import Layout from '#site-component/Layout';
	import EditableMarkdown from '#site-component/EditableMarkdown';
  	import svelteApp from '#site/core/svelte-app.js';

	const i18n = svelteApp.i18n.pages.commandsIndex;
	
	const CategoryEnum = {
		delete: i18n.category.delete,
		dev: i18n.category.dev,
		user: i18n.category.user,
		guild: i18n.category.guild,
		bot: i18n.category.bot,
		other: i18n.category.other
	}
	
	let commands = [];
	(async () => {
		const _commands = await fetchFromInnerApi("client/commands/list");
		console.log({_commands});
		commands = _commands;
	})();
</script>