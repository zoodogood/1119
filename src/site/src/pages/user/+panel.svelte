
<Layout>
	
	
	<ul style:--elements-size = "{ 2.85 - State.guilds?.length * 0.15 }em" class = "guilds-list">
		{#each State.guilds as guild}
		{@const onClick = () => State.target.id !== guild.id ? svelteApp.Hash.include({key: "guildId", value: guild.id}).apply() : svelteApp.Hash.remove("guildId").apply() }
		<li
			title = "Сервер { guild.name }"
			class:selected = { State.target.id === guild.id }
			data-id = { guild.id }
			on:click = { onClick }
			on:keydown = { onClick }
			on:contextmenu|preventDefault = { navigator.clipboard.writeText(guild.id) & alert(`Скопирован ID сервера ${ guild.name }`) }
		>
			{#if guild.iconURL}
				<img src = {guild.iconURL} alt = "guild-icon" class = "icon">
			{:else}
				<span class = "icon">{ guild.name.at(0) }</span>
			{/if}
		</li>
		{/each}
		<hr>
		<li class = "invite" title = "Пригласить">
			<a target = "_blank" href = { svelteApp.getBot().invite } rel = "noreferrer">
				<span class = "icon">
					{ "+" }
				</span>
			</a>
		</li>
	</ul>

	<main class = "page-main">
		<section>
			<span class = "icon-container">
				{#if State.target.icon}
					<img src = {State.target.icon} alt = "guild-icon" class = "icon">
				{:else}
					<span class = "icon">{ State.target.name?.at(0) ?? "/" }</span>
				{/if}
			</span>
			
		<h1>{State.target.name}</h1>
		</section>
		
		{#if State.target.type === TargetType.User}
			<UserSettings {svelteApp} target = {State.target}/>
		{:else}
			<GuildSettings {svelteApp} target = {State.target}/>
		{/if}
	</main>
	
</Layout>


<style>
	.guilds-list
	{
		--offset: 0;
		font-size: max(0.5em, var( --elements-size, 0em ));
		display: flex;
		list-style: none;
		gap: 0.15em;

		background-color: #88888810;
		border-radius: 0.2em;
		padding: 0.075em;

		align-items: center;
		
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
			margin-top: 1vh;
		}

		.guilds-list > li 
		{
			margin-top: var( --margin, 0 );
		}

		.guilds-list hr
		{
			width: 3px;
			height: 15px;
		}

		.page-main
		{
			padding-top: 10vh;
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

		.guilds-list > li 
		{
			margin-left: var( --margin, 0 );
		}

		.guilds-list hr
		{
			width: 15px;
			height: 3px;
		}

		.page-main
		{
			padding-left: 5vw;
		}
	}


	.guilds-list > li
	{
		width: calc( 0.5em + 0.5vw + 10px );
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		overflow: hidden;
		cursor: pointer;

		display: flex;
		flex-shrink: 0;

		scroll-snap-align: start;

		position: relative;

		filter: brightness(0.7);
		transition: filter 300ms;
	}

	.guilds-list > li > *
	{
		flex-grow: 1;
	}

	.guilds-list > hr:first-child
	{
		display: none;
	}


	.icon 
	{
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var( --dark );
		color: var( --white );
		width: 100%;
		height: 100%;

		font-size: 0.5em;
		font-weight: 600;
		font-family: monospace;
		user-select: none;
	}

	span.icon 
	{
		filter: contrast(0.7);
	}


	.guilds-list > li:hover
	{
		border-radius: 20%;
		background: #88888833;
		filter: brightness(1);
	}

	.guilds-list > li.selected
	{
		filter: brightness(1);
		border-radius: 40%;
	}

	.guilds-list > li.invite
	{
		filter: brightness(1);
	}

	.guilds-list > li.invite span
	{
		font-weight: 100;
		color: var( --white );
		transition: transform 300ms, background-color 1s, color 1s;
	}

	.guilds-list > li.invite:hover span
	{
		font-weight: 100;
		background-color: var( --main-color );
		transform: rotateZ(360deg);
	}









	.icon-container
	{
		display: flex;
		width: calc(3vw + 30px);
		aspect-ratio: 1 / 1;
		border-radius: 15px;
		overflow: hidden;
	}
</style>

<script>
	import Layout from '#site-component/Layout';
	import {UserSettings, GuildSettings} from '#site-component/frames/settings';
  	import svelteApp from '#site/core/svelte-app.js';
  	import PagesRouter from '#site/lib/Router.js';
	import { fetchFromInnerApi } from '#lib/safe-utils.js';
  	import { onMount } from 'svelte';

	const hashStore = svelteApp.Hash.store;

	const TargetType = {
		User: "User",
		Guild: "Guild"
	};
	const State = {
		guilds: [],
		selectedGuild: null,
		target: {}
	}
	
	$: {
		State.selectedGuild = State.guilds.find(guild => guild.id === $hashStore.guildId) ?? null;
		const targetType = State.selectedGuild ? TargetType.Guild : TargetType.User;
		const targetEntity = targetType === TargetType.User ? svelteApp.user : State.selectedGuild;

		State.target = {
			icon: targetEntity.avatarURL ?? targetEntity.iconURL,
			name: targetEntity.username ?? targetEntity.name,
			id: targetEntity.id,
			type: targetType
		};
	}
		
	

	onMount(async () => {
		const guilds = await fetchGuildsData();
		if (guilds === null){
			PagesRouter.redirect(`/oauth2/auth?redirect=${ svelteApp.url.subpath.join("/") }`);
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

