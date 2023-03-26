
<Layout>
	
	
	<ul style:font-size = "{ 3 - State.guilds?.length * 0.05 }em" class = "guilds-list">
		{#each State.guilds as guild}
		<li title = "Сервер { guild.name }">
			{#if guild.iconURL}
				<img src = {guild.iconURL} alt = "guild-icon">
			{:else}
				<span>{ guild.name.at(0) }</span>
			{/if}
		</li>
			
		{/each}
	</ul>
	
</Layout>


<style>
	.guilds-list
	{
		--offset: 0;
		display: flex;
		list-style: none;
		gap: 0.15em;

		background-color: #88888810;
		scroll-snap-align: center;
		border-radius: 0.2em;
		padding: 0.075em;
	}

	@media (max-width: 800px){
		.guilds-list
		{
			left: 50%;
			transform: translateX(-50%);
			position: absolute;
			max-width: 90vw;
			top: var( --offset );
			flex-direction: row;

			overflow-x: auto;
			overscroll-behavior-x: contain;
			scroll-snap-type: x mandatory;

			padding-inline: 0.5em;
			padding-bottom: 0.2em;
		}
	}

	@media (min-width: 800px){
		.guilds-list
		{	
			top: 50%;
			transform: translateY(-50%);
			position: fixed;
			max-height: 70vh;
			left: var( --offset );
			flex-direction: column;

			overflow-y: auto;
			overscroll-behavior-y: contain;
			scroll-snap-type: y mandatory;

			padding-block: 0.5em;
			padding-right: 0.2em;
		}
	}


	li
	{
		width: calc( 0.5em + 0.5vw + 10px );
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		overflow: hidden;
		cursor: pointer;

		display: flex;
		flex-shrink: 0;
	}

	li img 
	{
		width: 100%;
	}

	li span 
	{
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var( --dark );
		color: var( --white );
		filter: contrast(0.7);
		width: 100%;
		height: 100%;

		font-size: 0.5em;
		font-weight: 600;
		font-family: monospace;
	}

	li:hover
	{
		border-radius: 20%;
		background: #88888833;
	}
</style>

<script>
	import Layout from '#site-component/Layout';
  	import svelteApp from '#site/core/svelte-app.js';
  	import PagesRouter from '#site/lib/Router.js';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';
  	import { onMount } from 'svelte';
	import { ending } from '#lib/safe-utils.js';

	const State = {
		guilds: []
	}

	onMount(async () => {
		const guilds = await fetchGuildsData();
		if (guilds === null){
			PagesRouter.redirect(PagesRouter.getPageBy("oauth").key);
			return;
			
		}
		State.guilds = guilds.filter(guild => guilds.mutual.includes(guild.id));
	});


	async function fetchGuildsData(){
		const token = svelteApp.storage.getToken();
		if (!token){
			return null;
		}

		const headers = {Authorization: token, guilds: true};
		const userRaw = await fetchFromInnerApi("oauth2/user", {headers})
			.catch(() => {});

		if (!userRaw){
			return;
		}

		const {guilds, mutualBotGuilds} = userRaw;
		guilds.mutual = mutualBotGuilds;

		return guilds;
	}

</script>

