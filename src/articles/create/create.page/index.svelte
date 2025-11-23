<script>
	import Dialog from '#site-component/Dialog'
	import Layout from '#site-component/Layout'
	import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'
	import { MarkdownMetadata } from '#src/MarkdownMetadata.js'
	import svelteApp from '#src/site/build/components/app_singleton.js'
	import { page_location } from '#src/site/build/components/lib/page_router_singleton.js'

	const Contents = {
		filename: null ,
	}
	let labelNode
	const i18n = svelteApp.i18n.pages.articlesCreate

	const onFileUpload = async ( inputEvent ) => {
		const button = labelNode.querySelector( 'button' )
		button.setAttribute( 'disabled' , true )

		const files = inputEvent.target.files
		const file = files[ 0 ]

		const headers = {
			'Authorization': svelteApp.storage.getToken() ,
			'Content-Type': 'application/octet-stream' ,
			'FileName': file.name ,
		}

		const answer = await fetchFromInnerApi( 'site/articles/create' , {
			method: 'POST' ,
			body: file ,
			headers ,
		} )

		new Dialog( {
			target: document.body ,
			props: {
				title: i18n.serverResponse ,
				description: MarkdownMetadata.yaml.stringify( answer ) ,
				useClassic: true ,
			} ,
		} )
		button.removeAttribute( 'disabled' )

		Contents.filename = file.name
	}
</script>

<Layout>
	{#if !svelteApp.user}
		<p>{i18n.atFirstAuthorize}</p>
	{/if}
	<h1>{i18n.label}</h1>

	<main>
		<section class='main-buttons'>
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<label
				for='load-file'
				bind:this={labelNode}
				on:click={pointerEvent =>
					!svelteApp.user && pointerEvent.preventDefault()}
				on:keydown={keyEvent => !svelteApp.user && keyEvent.preventDefault()}
			>
				<input
					type='file'
					id='load-file'
					accept='.md'
					on:change={onFileUpload}
				/>
				<button
					on:click={() => labelNode.click()}
					disabled={!svelteApp.user || null}>{i18n.uploadMarkdown}</button
				>
			</label>
			{#if Contents.filename}
				<a
					href="{page_location("articles_item")}?id={svelteApp.user.id}/{Contents.filename}"
				>
					<button>{i18n.getDownToPage}</button>
				</a>
			{/if}
		</section>
	</main>

	<p>{i18n.generalCharacters.public}</p>
	<p>{i18n.generalCharacters.editable}</p>
	<p>{i18n.generalCharacters.author}</p>
	<p>{i18n.generalCharacters.noWarnings}</p>

	<hr />
	<section>
		<h4>{i18n.externalEditorSection.label}</h4>
		<p>
			{i18n.externalEditorSection.description}
		</p>
		<br />
		<iframe
			loading='lazy'
			title='editor-preview'
			src='https://dillinger.io/'
			style='width: 100%; height: 90vh;'
		></iframe>
		<hr />
	</section>
</Layout>

<style>
	input {
		display: none;
	}

	.main-buttons {
		display: flex;
		gap: 1em;
	}
</style>
