
<Layout>
	<article>
		<main>
			<h1>Сундук</h1>
			<p>
				При нажатии на кнопку отправляется запрос на сервер. Обработчик запроса содержится в отдельном файле по пути <code>~/src/server/api/user/open-chest.js</code>.
				Импортирует класс <code>ChestManager</code> из файла по пути <code>~/folder/commands/chest.js</code>, применяя его методы.
			</p>
			{#if !svelteApp.user}
				<small>~ Войдите в систему ещё раз</small>
			{/if}
			<button disabled = {!svelteApp.user} on:click={clickHandler}>Открыть сундук</button>
		</main>
		<section class = "logger">
			<img src = { Resources.imageURL } alt="chest">
			<ul class = "logger-list">
				{#each State.loggerList as log, i}
					{#key log}
						<li style:--i = { i }>{ log }</li>
					{/key}
				
				{/each}
			</ul>
		</section>
	</article>
	
</Layout>

<script>
  	import { fetchFromInnerApi, timestampToDate } from '#lib/safe-utils.js';
	import Layout from '#site-component/Layout';
  	import svelteApp from '#site/core/svelte-app.js';

	const Resources = {
		imageURL: "https://media.discordapp.net/attachments/629546680840093696/778990528947027988/ezgif.com-gif-maker.gif?width=540&height=630"
	}

	const State = {
		loggerList: []
	}

	async function clickHandler(pointerEvent){
		const headers = {Authorization: svelteApp.storage.getToken()};
		const json = await fetchFromInnerApi("user/chest-open", {headers, method: "POST"});
		if (!json){
			return;
		}

		if (json.notAllowed){
			State.loggerList = ["АААА СУНДУК НА ПЕРЕЗАРЯДКЕ!", timestampToDate(json.value)];
			return;
		}

		State.loggerList = [`Бонусов: ${ json.openCount }`, `Сокровищ: ${ Object.keys(json.treasures).length }:`, ...Object.entries(json.treasures).map(entrie => entrie.join(" "))];
	}
</script>


<style>
	button
	{
		margin-top: 10px;
		transition: transform 1s;
		width: 10em;
		height: 3em;
		font-size: 1.2em;
	}

	button:not([disabled]):hover
	{
		transform: scale(0);
	}

	article
	{
		display: flex;
		flex-wrap: wrap;
	}

	main
	{
		flex-grow: 3;
		width: 600px;
	}

	.logger
	{
		flex-grow: 1;
		flex-shrink: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.logger-list 
	{
		min-width: 250px;
		text-align: center;
	}


	.logger li:first-of-type
	{
		font-size: 1em;
		text-transform: uppercase;
	}

	.logger li
	{
		animation-duration: 1s;
		animation-name: apparance;
		animation-delay: calc(1.2s * var(--i));
		animation-fill-mode: forwards;
		opacity: 0;
		font-size: 0.8em;
	}

	@keyframes apparance
	{
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}


	img 
	{
		max-width: 100%;
	}
</style>