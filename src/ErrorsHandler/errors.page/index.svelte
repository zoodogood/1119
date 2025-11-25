<script>
	import Icon from '#site-component/iconic'
	import Layout from '#site-component/Layout'
	import dayjs from '#src/dayjs.js'
	import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'
	import svelteApp from '#src/site/build/components/app_singleton.js'
	import { page_location } from '#src/site/build/components/lib/page_router_singleton.js'

	const Component = {
		errors: [] ,
	}
	const i18n = svelteApp.i18n.pages.errorsIndex;

	( async () => {
		const { list , metadata } = await fetchFromInnerApi( 'errors/files' )
		const entries = list.map( ( key , index ) => [ key , metadata[ index ] ] ).reverse()

		Component.errors = entries
		console.info( '=== Component.errors ===\n' , Component.errors )
	} )()
</script>

<Layout>
	<main>
		<h1>{i18n.label}</h1>
		<ul class='errors-list'>
			{#each Component.errors as [ timestamp , errorFile ] , i}
				<li
					class='error-file'
					class:special={timestamp === null}
					data-uniqueErrors={errorFile?.errorsCount}
				>
					<a
						href="{page_location( 'errors_list_item' )}/:{timestamp || ''}"
					>
						<big>ID: {Component.errors.length - i}</big>
						<p>
							{#if timestamp}
								{i18n.created}
								<code
								>{timestamp
									? dayjs( +timestamp ).format( 'DD.MM HH:mm' )
									: null}</code
								>
							{:else}
								{i18n.inRealTime}
							{/if}
						</p>
						<br />

						{#if errorFile}
							<section class='metadata-container'>
								<ul>
									<li data-value={errorFile.errorsCount ?? null}>
										{i18n.uniqueMessages}
										{errorFile.uniqueErrors?.length || 0}
										{i18n.units} ・ {errorFile.errorsCount}
									</li>
									<li data-value={errorFile.uniqueTags?.length || null}>
										{i18n.tags}
										{errorFile.uniqueTags?.join( ', ' )}
									</li>
									<li data-value={errorFile.reportsCount || null}>
										<Icon code='' />{i18n.reports}
										{errorFile.reportsCount}
									</li>
								</ul>
							</section>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</main>
</Layout>

<style>
	h1 {
		color: #3b7c4c;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	.errors-list {
		display: flex;
		flex-wrap: wrap;
		list-style: none;
		gap: 15px;
	}

	.error-file {
		border-radius: 15px;
		background-color: #88888811;
		width: calc(400px + 5vw);
		height: calc(300px + 3vw);
		flex-grow: 1;

		font-size: 0.8em;
		position: relative;
	}

	.error-file[data-uniqueErrors="0"] {
		opacity: 0.5;
	}

	.error-file a {
		widows: 100%;
		height: 100%;
		padding: 0.5em;
		display: block;
		cursor: pointer;
		color: var(--text-theme-accent);
		text-decoration: none;
	}

	.error-file:hover {
		background-color: #88888844;
	}

	.metadata-container ul {
		display: flex;
		flex-direction: column;
		list-style: none;
	}

	.error-file .metadata-container li {
		font-size: 0.7em;
		opacity: 0.7;
	}

	.error-file .metadata-container li:not([data-value]) {
		display: none;
	}

	.error-file.special big::before {
		content: "";
		font-family: "Icon";
		float: right;
		display: block;
		width: 1em;

		right: 1em;
		top: 0.5em;
		font-size: 1.2em;
		opacity: 0.3;
	}
</style>
