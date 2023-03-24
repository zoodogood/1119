
<Layout>

	<p>Взаимные гильдии: { ending(State.guilds.length, "сущност", "ей", "ь", "и") }</p>
	
	
	<ul style:font-size = "{ 5 - State.guilds?.length * 0.05 }em">
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
	ul 
	{
		display: flex;
		flex-wrap: wrap;
		list-style: none;
		gap: 0.2em;
	}
	li
	{
		min-width: 2vw;
		width: 1em;
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		overflow: hidden;
		cursor: pointer;
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
		background-color: #88888820;
		width: 100%;
		height: 100%;

		font-size: 0.5em;
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

