
<main>
	<h1>Hello 1119!</h1>
	<ul>
		{#each errors as error}
			<p>{ error }</p>
		{/each}
	</ul>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>


<script>

	let errors = [];

	(async () => {
		const fileName = "";
		const BASE = "http://localhost:8001/errors/files/";
		const url = `${ BASE }${ fileName }`;
  		const response = await fetch(url);

		const data = await response.json();
		errors = data;
	})();
  
</script>