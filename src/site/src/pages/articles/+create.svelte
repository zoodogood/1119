<Layout>
	{#if !svelteApp.user}
		<p>Сначала авторизуйтесь*</p>
	{/if}
	<h1>Написать статью</h1>

	<main>
		<label for="load-file" bind:this = { labelNode } on:click={(pointerEvent) => !svelteApp.user && pointerEvent.preventDefault()} on:keydown={(keyEvent) => !svelteApp.user && keyEvent.preventDefault()}>
			<input type="file" id="load-file" accept=".md" on:change={onFileUpload}>
			<button on:click = {() => labelNode.click()} disabled = {!svelteApp.user || null}>Загрузить .md файл</button>
		</label>
		
	</main>
	{#each Contents.fileSendAnswers as answer}
		<p>Ответ от сервера:</p>
		<span>{ answer }</span>
	{/each}
	<p>После загрузки содержимое обретёт публичный характер.</p>
	<p>Вы сможете внести изменения в любой момент времени.</p>
	<p>Ваши никнейм и аватар будут видны другим.</p>
	<p>Других предупреждений нет.</p>
	

</Layout>


<style>
	input
	{
		display: none;
	}
</style>


<script>
	import Layout from '#site-component/Layout';
	import Dialog from '#site-component/Dialog';

	import PagesRouter from '#site/lib/Router.js';
  	import { fetchFromInnerApi, sleep } from '#lib/safe-utils.js';
  	import { svelteApp } from '#site/core/svelte-app.js';

	const Contents = {
		fileSendAnswers: []
	}
	let labelNode;

	const onFileUpload = (async (inputEvent) => {
		const button = labelNode.querySelector("button");
		button.setAttribute("disabled", true);

		const files = inputEvent.target.files;
		const file = files[0];

		const headers = {
			Authorization: svelteApp.storage.getToken(),
			"Content-Type": "application/octet-stream",
			"FileName": file.name
		};

		console.dir(file);
		

		const answer = await fetchFromInnerApi(
			"site/articles/create",
			{method: "POST", body: file, headers}
		);

		new Dialog({
			target: document.body,
			props: {title: "Ответ сервера:", description: answer, useClassic: true}
		});
		button.removeAttribute("disabled");
	});
	


</script>