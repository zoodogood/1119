<Layout>
<main>
	<h1>Комплекты ошибок:</h1>
	<ul>
		{#each Component.errors as errorFile, i}
			{@const [day, month, hour, minute] = errorFile.name.split("-").map(number => `0${ number }`.slice(-2))}
			<li class = "error-file">
				<p>ID: { i + 1 }</p>
				<p>от: <code>{ day }.{ month }</code>, <code>{ hour }:{ minute }</code></p>
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

	li
	{
		padding: 0.5em;
		border-radius: 15px;
		background-color: #88888811;
		width: 400px;
		height: 300px;
		flex-grow: 1;
	}

	.error-file:hover
	{
		background-color: #88888844;
	}

</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
	import Layout from '#site-component/Layout';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';

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
		const fileName = "";
  		const data = await fetchFromInnerApi("errors/files");

		const errors = data
			.map(parseName);

		

		Component.errors = errors;
	})();
  
</script>