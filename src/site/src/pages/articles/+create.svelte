<Layout>
	{#if !svelteApp.user}
		<p>Сначала авторизуйтесь*</p>
	{/if}
	<h1>Написать статью</h1>

	<main>
		<section class = "main-buttons">
			<label for="load-file" bind:this = { labelNode } on:click={(pointerEvent) => !svelteApp.user && pointerEvent.preventDefault()} on:keydown={(keyEvent) => !svelteApp.user && keyEvent.preventDefault()}>
				<input type="file" id="load-file" accept=".md" on:change={onFileUpload}>
				<button on:click = {() => labelNode.click()} disabled = {!svelteApp.user || null}>Загрузить .md файл</button>
			</label>
			{#if Contents.filename}
				<a href = "{ PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/item").key) }?id={ svelteApp.user.id }/{ Contents.filename }">
					<button>Перейти к созданной странице</button>
				</a>
			{/if}
		</section>
		
	</main>
	
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

	.main-buttons
	{
		display: flex;
		gap: 1em;
	}
</style>


<script>
	import Layout from '#site-component/Layout';
	import Dialog from '#site-component/Dialog';

	import PagesRouter from '#site/lib/Router.js';
  	import { fetchFromInnerApi, MarkdownMetadata, sleep } from '#lib/safe-utils.js';
  	import { svelteApp } from '#site/core/svelte-app.js';

	const Contents = {
		filename: null
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
		

		const answer = await fetchFromInnerApi(
			"site/articles/create",
			{method: "POST", body: file, headers}
		);

		new Dialog({
			target: document.body,
			props: {title: "Ответ сервера:", description: MarkdownMetadata.yaml.stringify(answer), useClassic: true}
		});
		button.removeAttribute("disabled");

		Contents.filename = file.name;
	});
	


</script>