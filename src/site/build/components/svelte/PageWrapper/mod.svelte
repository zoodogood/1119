<script>
	import config from '#config'
	import { Theme } from '#site-component/ThemeSwitcher'
	import { relativeSiteRoot } from '#src/site/build/components/lib/util.js'

	import { writeError } from '#src/site/build/components/lib/writeErrorToServer.js'
	import { PopupsHandler } from '#src/site/build/components/svelte/Popups/index.js'
	import { onMount } from 'svelte'
	import { MetaTags } from 'svelte-meta-tags'
	import Notifications from 'svelte-notifications'
	import { get as getStoreValue } from 'svelte/store'
	import svelteApp from '../../app_singleton.js'

	const { page } = $props()
	const languageAlternates = config.i18n.availableLanguages.map( ( locale ) => {
		const href = relativeSiteRoot( svelteApp , svelteApp.url.subpath.join( '/' ) )
		return { hrefLang: locale , href }
	} )

	const i18n = svelteApp.i18n.general
	document.documentElement.setAttribute( 'lang' , svelteApp.lang )

	onMount( () => {
		addEventListener( 'unhandledrejection' , async ( event ) => {
			const { reason } = event
			writeError( reason )
		} )

		addEventListener( 'error' , ( event ) => {
			writeError( event )
		} )
	} )
</script>

<Notifications>
	<svelte:component this={page} />
</Notifications>
<PopupsHandler />

<MetaTags
	title={i18n.title}
	{languageAlternates}
	canonical={relativeSiteRoot( svelteApp )}
	additionalMetaTags={[
		{
			name: 'theme-color' ,
			content: Theme.collection.get( getStoreValue( Theme.current ) )[
				'--main-color'
			] ,
		} ,
	]}
/>
