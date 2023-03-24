

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
				<button on:click = { close }><Icon code = ""/> или кликните вне диалогового окна</button>
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
		 animation: apparance 1s;
		 box-shadow: 0px 3px 30px -15px var( --main-color );
	}

	@keyframes apparance
	{
		0% {
			opacity: 0.5;
			transform: translate(-50%, -100vh);
		}

		100% {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	:global(html):has(dialog)
	{
		overflow: hidden;
	}

	

	.classic-dialog
	{
		background-color: var( --background-theme-accent );
		padding: calc(10px + 1vw);
		border-radius: 15px;
		min-width: 400px;

		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;

		color: var( --text-theme-accent );
		border: 1px solid var( --main-color );		

		white-space: pre-wrap;
		overflow: auto;
	}

	@media (max-width: 700px){
		dialog
		{
			max-width: 95vw;
		}

		.classic-dialog
		{
			width: 100%;
			min-width: 0;
			padding: 10px;
		}

		.classic-dialog span
		{
			padding: 0.5em;
		}
	}



	.classic-dialog p 
	{
		font-family: 'PTMono', sans-serif;
		text-transform: uppercase;
		opacity: 0.8;
		font-size: 0.7em;
	}

	.classic-dialog span
	{
		position: relative;
		padding: calc(3px + 0.3vw);
		align-self: baseline;
		max-width: 100%;
	}

	

	.classic-dialog::before
	{
		content: '';
		display: block;
		height: 2px;
		width: 70%;

		background-color: var( --main-color );
		opacity: 0.2;
	}
</style>





<script>
	import { onDestroy, createEventDispatcher } from "svelte";
	import Icon from '#site-component/iconic';
  	import { get_current_component as getCurrentComponent } from "svelte/internal";

	export let useClassic;
	export let title;
	export let description;
	export let preventDestroy = false;
	export let hide = false;

	const self = getCurrentComponent();
	
	let ref;
	

	const dispatch = createEventDispatcher();
	const close = () => {
		if (!ref.open){
			return;
		}

		ref.close();
		history.state.isModal && history.go(-1);
		dispatch.call(ref, "close");
	};
	const open = () => {
		if (ref.open){
			return;
		}

		ref.showModal();
		globalThis.history.pushState({isModal: true}, "Open modal");
		addEventListener("popstate", close);
	};
	const destroy = () => !preventDestroy && self.$destroy();

	$: 
		if (ref && !hide) open();

	onDestroy(() => {
		removeEventListener("popstate", close);
	})
</script>