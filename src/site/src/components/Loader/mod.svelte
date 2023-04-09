<script>
   import { onDestroy, onMount } from "svelte";
	import { sleep } from '#lib/safe-utils.js';

	export let
		count = 7,
		waveDuration = 1000,
		delay = 0,
		sleepDuration = 1000,
		cutOff = true,
		lineWidth = "10%",
		width = "max(100px, 100%)",
		color = null;

	let animate = false;
	let isDestroy = false;

	async function launchAnimation(){
		await sleep(delay);
		animate = true;
		await sleep(waveDuration + count * 100);
		animate = false;
	}

	onMount(async () => {

		if (!cutOff){
			animate = true;
			return;
		}
		
		while (!isDestroy){
			launchAnimation();
			await sleep(sleepDuration + waveDuration);
		}
	});

	onDestroy(() => isDestroy = true);

</script>

<article class:animate = {animate} style = "--width: { width }; --duration: { waveDuration }ms; --line-width: { lineWidth };" style:--main-color = { color }>
	{#each [...new Array(count)] as _, i}
		<aside style = "--i: { i };"></aside>
	{/each}
 </article>


<style>

article
{
	width: var( --width );
	aspect-ratio: 1;
	display: flex;
	justify-content: space-between;
	align-items: center;

	contain: layout paint;
}

article.animate aside
{
	animation: scaleY var( --duration ) linear;
	animation-delay: calc(0.1s * var( --i ));
}

aside
{
  width: var( --line-width );
  height: 70%;
  display: inline-block;
  transform-origin: bottom center;
  border-radius: 20px;
}


@keyframes scaleY {
  0% {
    transform: scaleY(0.1);
	 background: var( --white );
  }
  50% {
    transform: scaleY(1);
    background: var( --main-color );
  }
  100% {
    transform: scaleY(0.1);
	 background: var( --white );
  }
}

</style>