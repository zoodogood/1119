<main>
	<slot/>
</main>

<style>
	main
	{
		padding: calc(1em + 3vw);
		display: flex;
		flex-direction: column;

		gap: 2vh;
		padding-top: 1.5vw;
		min-height: 50vh;
	}
</style>