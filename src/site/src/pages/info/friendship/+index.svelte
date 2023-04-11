
<main class = "page-main">
	{#each [...Component.sectionsEnum] as element}
	{@const [key, {content, className}] = element}
		<section>
			<main class = { className }>{@html content}</main>
		</section>
	{/each}
</main>



<style>
	.page-main
	{
		display: flex;
		flex-direction: column;

		scroll-snap-type: y mandatory;
		scroll-behavior: auto;
		overscroll-behavior-y: contain;

		max-height: 100lvh;
		overflow-y: auto;

		counter-reset: section;
		padding-bottom: 10vh;
	}

	.page-main::-webkit-scrollbar
	{
		width: 0;
	}


	section
	{
		flex-shrink: 0;
		scroll-snap-align: start;
		scroll-snap-stop: always;

		height: 100lvh;
		width: 100%;

		background-color: var( --background-theme-accent );
		color: var( --text-theme-accent );
	}


	section:nth-child(2n)
	{
		filter: contrast(0.9);
	}


	section::before
	{
		counter-increment: section;
		content: "[" counter(section) "]";
		display: inline-block;
		
		opacity: 0.2;
		font-weight: 100;
		font-size: 1.5em;
		padding: 0.2em;
	}

	section > main
	{
		width: 100%;
		height: 100%;
		display: block;
		padding: calc(2vw + 1em);
		padding-bottom: calc(5vw + 2.5em);
	}

	.flex
	{
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.center
	{
		justify-content: center;
		align-items: center;
	}
</style>


<script>
	import Header from '#site-component-lib/Layout/Header.svelte';
	import Main from '#site-component-lib/Layout/Main.svelte';

	const Component = {
		sectionsEnum: new Map(Object.entries({
			welcome: {
				content: "123",
				className: null
			},
			welcome2: {
				content: "<p>Вернуться</p><button>Домой</button>",
				className: "flex center"
			}
		}))
	}
</script>
