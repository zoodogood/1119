<element-container class = "component" bind:this = { Component.node } class:second-style = { Component.style === ComponentStyles.Second }>
	<IntersectionObserver on:intersect = {Interaction.onIntersection} element = { Component.node } once/>
	<ul>
		{#each [...Component.statsEnum] as element}
			{@const [key, {displayedValue, label}] = element}
			<li>
				{#key displayedValue}
					<span>{ displayedValue }</span>
				{/key}
				<h6>{ label }</h6>
			</li>
		{/each}
	</ul>
	<hr>
</element-container>


<style>
	element-container
	{
		flex-direction: column;
		justify-content: start;
		align-items: center;
		container: Statistic / inline-size;
		padding-top: 15cqw;

		gap: 3vh;

		background-color: var( --background-theme-accent );
		color: var( --text-theme-accent );
		
		clip-path: polygon(0% 2%, 100% 0%, 100% 80%, 30% 80%, 10% 100%, 9% 78%, 10% 77%, 0% 80%);
		aspect-ratio: 1.75 / 1;
		margin-inline: 1vw;


		transition: filter 1s;
	}

	element-container.second-style
	{
		filter: invert(0.9);
	}

	ul
	{
		list-style: none;
		display: flex;
		gap: calc(1.5em + 2vw);
	}

	li
	{
		text-align: center;
	}

	span
	{
		font-weight: 700;
		animation: apparance 0.5s;
		display: inline-block;
	}

	@keyframes apparance
	{
		0% {
			transform: translateY(-50%);
		}

		100% {
			transform: translateY(0);
		}
	}

	h6
	{
		font-weight: 100;
		margin: 0;

		padding: 0;
		text-transform: capitalize;
	}
</style>


<script>
	import IntersectionObserver from "svelte-intersection-observer";
  	import { onMount } from "svelte";
  	import { fetchFromInnerApi, sleep } from "#lib/safe-utils.js";
  	import svelteApp from "#site/core/svelte-app.js";

	const i18n = svelteApp.i18n.frames.Statistic;

	const ComponentStyles = {
		First: 1,
		Second: 2
	}

	const Component = {
		node: null,
		style: ComponentStyles.First,

		statsEnum: new Map(Object.entries({
			guilds: {
				value: null,
				displayedValue: 0,
				label: i18n.statsEnum.guilds.label
			},
			users: {
				value: null,
				displayedValue: 0,
				label: i18n.statsEnum.users.label
			},
			commands: {
				value: null,
				displayedValue: 0,
				label: i18n.statsEnum.commands.label
			}
		})),

		
		async renderStat(key){
			const element = Component.statsEnum.get(key);

			const iterable = Component.statContentGenerator(element.value);
			
			for (const content of iterable){
				await sleep(500 + Math.random() * 200);
				element.displayedValue = content;
				Component.statsEnum ||= Component.statsEnum;
			}
			

			
		},

		async renderAllStats(){
			for (const [key] of State.stats){
				const element = State.stats.get(key);
				element.value = State.data[key];

				await Component.renderStat(key);
			} 
		},

		*statContentGenerator(value){
			value = String(value);
			let base = "0".repeat(value.length).split("");
			
			for (const index in base){
				base[index] = value[index];
				yield base.join("");
			}

			return base.join("");
		}
	}

	const Interaction = {
		async onIntersection(customEvent){
			if (State.isVisible){
				return
			}
			State.isVisible = true;

			await State.dataPromise;
			await sleep(500);
			await Component.renderAllStats();

			await sleep(500);
			Component.style = ComponentStyles.Second;
		}
	}

	const State = {
		isVisible: false,
		data: null,
		dataPromise: null,
		stats: Component.statsEnum
	}

	onMount(async () => {
		State.dataPromise = fetchFromInnerApi("client/statistic/general");
		const data = await State.dataPromise;
		if (!data){
			return;
		}

		State.data = data;
	})

	
	
</script>