
<main>
	<h1>Hello 1119!</h1>
	<ul>
		<!-- Для каждой итерации создаётся обёртка. Внутрь { } помещаются переменные "извне". В остальном это обычный HTML  -->
		{#each errors as errorFile, i}
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

	let errors = [];
	import svelteApp from "#site/core/svelte-app.js";

	const parseName = (fullname) => {
		const name = fullname.match(/.+?(?=\.json$)/)?.at(0);
		const [day, month, hour, minute] = name?.split("-") ?? [];

		const date = new Date(svelteApp.data.Date.getFullYear(), month - 1, day, hour, minute);
		const timestamp = date.getTime();
		return {fullname, name, timestamp};
	}

	(async () => {
		const fileName = "";
		const BASE = "http://localhost:8001/errors/files/";
		const url = `${ BASE }${ fileName }`;
  		const response = await fetch(url);

		let data = (await response.json())
			.map(parseName);

		// Здесь ты можешь менять данные

		errors = data;

		console.log(errors);
	})();
  
</script>