
<Layout>

	<p>На каких гильдиях вы находитесь:</p>
	<p>Гильдий: { ending(State.guilds.length, "сущност", "ей", "ь", "и") }</p>
	<ul>
		{#each State.guilds as guild}
		<li style:width = "{ 10 - State.guilds?.length * 0.1 }em" title = "Сервер { guild.name }">
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
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		overflow: hidden;
	}

	li img 
	{
		max-width: 100%;
	}

	li span 
	{
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #88888820;
		width: 100%;
		height: 100%;
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
		State.guilds = guilds;
	});


	async function fetchGuildsData(){
		const token = svelteApp.storage.getToken();
		if (!token){
			return null;
		}

		const headers = {Authorization: token};
		const userRaw = await fetchFromInnerApi("oauth2/user", {headers})
			.catch(() => {});

		if (!userRaw){
			return;
		}

		const {guilds} = userRaw;


		return guilds;
	}

</script>

