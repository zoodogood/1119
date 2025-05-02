<script>
	import config from '#config'
	import svelteApp from '#src/site/_build/components/app_singleton.js'
	import { onMount } from 'svelte'

	export let tag = svelteApp.document.location.href

	const i18n = svelteApp.i18n.components.Giscus

	const InitGiscus = () => {
		const document = svelteApp.document
		const giscusConfig = config.giscus

		const giscusSource = 'https://giscus.app/client.js'
		const lang = svelteApp.lang

		const themes = {
			dark: 'dark' ,
			light: 'light' ,
		}
		const selectedTheme
			= document.documentElement.style.getPropertyValue( '--theme-accent-name' )
				=== themes.light
				? themes.light
				: themes.dark

		const node = document.createElement( 'script' )
		;[
			[ 'src' , giscusSource ] ,
			[ 'data-repo' , giscusConfig.repository ] ,
			[ 'data-repo-id' , giscusConfig.repoId ] ,
			[ 'data-category' , giscusConfig.categoryName ] ,
			[ 'data-category-id' , giscusConfig.categoryId ] ,
			[ 'data-mapping' , 'specific' ] ,
			[ 'data-term' , tag ] ,
			[ 'data-strict' , '0' ] ,
			[ 'data-reactions-enabled' , '1' ] ,
			[ 'data-emit-metadata' , '0' ] ,
			[ 'data-input-position' , 'top' ] ,
			[ 'data-theme' , selectedTheme ] ,
			[ 'data-lang' , lang ] ,
			[ 'data-loading' , 'lazy' ] ,
			[ 'crossorigin' , 'anonymous' ] ,
			[ 'async' , true ] ,
		].forEach( ( [ name , value ] ) => {
			node.setAttribute( name , value )
		} )

		document.body.appendChild( node )
	}

	onMount( InitGiscus )
</script>

<section class='discus-container'>
	<group>
		<h4>{i18n.comments}</h4>
		<small>{i18n.identify} <code>{tag}</code></small>
	</group>

	<main class='giscus'>
		<p>{i18n.notSupported}</p>
	</main>
</section>

<style>
	group {
		align-self: baseline;
	}

	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2em;
	}

	section::after {
		content: "";
		display: block;
		width: 70%;
		height: 2px;
		background-color: #88888822;
	}
</style>
