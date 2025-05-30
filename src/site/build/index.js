import svelteApp from '#src/site/build/components/app_singleton.js'
import { current_page_by_route } from '#src/site/build/components/lib/page_router_singleton.js'
import PageWrapper from '#src/site/build/components/svelte/PageWrapper/mod.svelte'
import { mount } from 'svelte'

mount( PageWrapper , {
	target: svelteApp.document.body ,
	props: { page: current_page_by_route() } ,
} )
