<script>
	import { onMount, onDestroy, createEventDispatcher } from "svelte";
  	import { get_current_component as getCurrentComponent } from "svelte/internal";

	export let useClassic;
	export let title;
	export let description;

	const self = getCurrentComponent();
	
	let ref;
	

	const dispatch = createEventDispatcher();
	const close = () => {
		ref.close();
		history.state.isModal && history.go(-1);
		dispatch.call(ref, "close");
	};
	const destroy = () => self.$destroy();


	onMount(() => {
		ref.showModal()
		globalThis.history.pushState({isModal: true}, "Open modal");
		addEventListener("popstate", close);
		
	});

	onDestroy(() => {
		removeEventListener("popstate", close);
	})
</script>

<dialog
	bind:this = { ref }
	on:click = { close }
	on:close = { destroy }
	on:keydown = { ({key}) => key === "Esc" && close() }
>
	<main on:click|stopPropagation on:keydown|stopPropagation>
		{#if useClassic}
			<article class = "classic-dialog">
				<p>{ title }</p>
				<span>{ description }</span>
				<button on:click = { close }>Закрыть</button>
			</article>
		{/if}
		<slot/>
	</main>
</dialog>

<style>
	dialog::backdrop
	{
		 background-color: #0009;
		 backdrop-filter: blur(2px) saturate(5%);
		 cursor: zoom-out;
	}

	dialog
	{
		 top: 50%;
		 left: 50%;
		 transform: translate(-50%, -50%);
		 max-width: 85vw;
		 max-height: 80vh;


		 background-color: transparent;
		 border: none;

		 overflow: auto;
	}

	:global(html):has(dialog)
	{
		overflow: hidden;
	}

	.classic-dialog
	{
		background-color: var( --background-theme-accent );
		padding: 30px;
		border-radius: 15px;
		min-width: 400px;

		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;

		font-family: 'PTMono';
		color: var( --text-theme-accent );
		border: 1px solid var( --main-color );		
	}

	.classic-dialog::before
	{
		content: '';
		display: block;
		height: 2px;
		width: 70%;

		background-color: var( --main-color );
		opacity: 0.5;
	}
</style>