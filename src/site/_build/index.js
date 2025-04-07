import { current_page_by_route } from '#root/src/site/_build/src/lib/page_router_singleton.js'
import svelteApp from '#root/src/svelte/app/singleton.js'
import PageWrapper from '#site/components/PageWrapper/mod.svelte'
import { mount } from 'svelte'

mount( PageWrapper , {
	target: svelteApp.document.body ,
	props: { page: current_page_by_route() } ,
} )
