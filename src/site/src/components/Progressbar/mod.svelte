<span class = "component">
	<p>
		<small>{ Math.floor($progress) }/{ max }</small>
		<span>{ targetLabel }</span>
	</p>
	

	<span style:--value = { percent * 100 } class = "progressbar">
		<element-layout/>
	</span>
</span>



<style>
	.component
	{
		font-size: 0.8em;
	}

	p
	{
		display: flex;
		justify-content: space-between;
		user-select: none;
	}

	.progressbar
	{
		display: flex;
		position: relative;
		overflow: hidden;

		align-items: center;
		width: 100%;
		height: 0.3em;

		border-radius: 1em;
		margin-block: 0.5em;
		background-color: #88888811;
	}

	element-layout
	{
		clip-path: polygon(0 0, 89% 0, 100% 100%, 0 98%);
		background-color: var( --main-color );
		width: calc(1% * var( --value ));
		aspect-ratio: 5 / 1;
	}
</style>


<script>
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let 
		max = 100,
		value = 70,
		percent = value / max,

		targetLabel = "";
		
	value = percent * max;

	const progress = tweened(0, {
		duration: 3000,
		easing: cubicOut
	});

	$: progress.set(value);

	$: percent = $progress / max;
</script>