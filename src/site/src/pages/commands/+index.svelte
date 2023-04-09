<Layout>
	<h3>TO-DO: Задача. Полностью изменить внешний вид этой страницы</h3>
	<section>
		<ul>
			{#each commands as command}
			<li>
				<h2>{ command.name }</h2>
				<EditableMarkdown source = { command.media.description.trim() }/>
				<footer>
					<span class = "category">{ CategoryEnum[ command.type ]}</span>
					{#if command.media.poster}
						<img src = { command.media.poster } alt="poster" fetchpriority = "low" loading = "lazy">
					{/if}
					<h6>
						{#each command.allias.split(" ") as allias}
							<span>!{ allias }</span>
						{/each}
					</h6>
				</footer>
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

		font-size: 0.9em;
	}

	h2
	{
		text-transform: uppercase;
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

	.category 
	{
		background-color: #88888811;
		display: inline-block;
		width: fit-content;
		padding: 0.2em;

		margin-top: 1.5em;
	}

	footer
	{
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-top: auto;
	}

	h6
	{
		margin-top: 0.75em;
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