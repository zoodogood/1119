
<main>
	<h1>Hello 1119!</h1>
	<ul>
		<!-- Для каждой итерации создаётся обёртка. Внутрь { } помещаются переменные "извне". В остальном это обычный HTML  -->
		{#each Component.errors as errorFile, i}
			<li class = "error-file">
				{ i }.
				<p>{ errorFile.name }</p>
				<br>
			</li>
		{/each}
	</ul>
</main>

<style>

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	.error-file:hover
	{
		background-color: #88888844;
	}

</style>


<script>
	import svelteApp from "#site/core/svelte-app.js";
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