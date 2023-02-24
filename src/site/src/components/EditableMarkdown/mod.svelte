<script>
	export let source;
	import SvelteMarkdown from "svelte-markdown";
</script>

<style>
	.editable-markdown-container
	{
		line-height: 1.35;
		font-family: 'PTMono', 'Roboto', sans-serif;
	}

	.editable-markdown-container :global(*[id]):hover::before
	{
		content: '#';
		color: var( --main-color );
		opacity: 0.5;
		position: absolute;
		transform: translateX( -1em );
	}

	.editable-markdown-container :global(hr)
	{
		width: 100%;
		margin-block: 0.2em;
	}

	.editable-markdown-container :global(p)
	{
		opacity: 0.9;
	}

	.editable-markdown-container :global(ol),
	.editable-markdown-container :global(ul)
	{
		margin-block: 0.5em;
		margin-left: 1em;
	}
</style>

<article class = "editable-markdown-container">
	<SvelteMarkdown {source}/>
</article>

