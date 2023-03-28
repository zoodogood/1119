<Layout>
	{#if !svelteApp.user}
		<p>{ i18n.atFirstAuthorize }</p>
	{/if}
	<h1>{ i18n.label }</h1>

	<main>
		<section class = "main-buttons">
			<label for="load-file" bind:this = { labelNode } on:click={(pointerEvent) => !svelteApp.user && pointerEvent.preventDefault()} on:keydown={(keyEvent) => !svelteApp.user && keyEvent.preventDefault()}>
				<input type="file" id="load-file" accept=".md" on:change={onFileUpload}>
				<button on:click = {() => labelNode.click()} disabled = {!svelteApp.user || null}>{ i18n.uploadMarkdown }</button>
			</label>
			{#if Contents.filename}
				<a href = "{ PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/item").key) }?id={ svelteApp.user.id }/{ Contents.filename }">
					<button>{ i18n.getDownToPage }</button>
				</a>
			{/if}
		</section>
		
	</main>
	
	<p>{ i18n.generalCharacters.public }</p>
	<p>{ i18n.generalCharacters.editable }</p>
	<p>{ i18n.generalCharacters.author }</p>
	<p>{ i18n.generalCharacters.noWarnings }</p>
	

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

	const i18n = svelteApp.i18n.pages.articlesCreate;
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
			props: {title: i18n.serverResponse, description: MarkdownMetadata.yaml.stringify(answer), useClassic: true}
		});
		button.removeAttribute("disabled");

		Contents.filename = file.name;
	});
	


</script>