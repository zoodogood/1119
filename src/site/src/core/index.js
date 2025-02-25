import PageWrapper from "#site/components/PageWrapper/mod.svelte";
import svelteApp from "#site/core/svelte-app_singleton.js";
import { current_page_by_route } from "#site/lib/page_router_singleton.js";
import { mount } from "svelte";

mount(PageWrapper, {
	target: svelteApp.document.body,
	props: { page: current_page_by_route() },
});
