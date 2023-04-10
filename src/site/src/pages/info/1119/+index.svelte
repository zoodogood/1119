<Layout>
	<header>
		<element-wrapper>
			<img src = "https://images-ext-2.discordapp.net/external/fBq1I0O3Tdhoi-DeVVm7nDadXN-uzdgKveyekp-Vm88/https/media.discordapp.net/attachments/769566192846635010/872776969341796382/mute.gif" alt = "muteCommand">
		</element-wrapper>
	</header>

	<main bind:this = { Component.mainNode } class = "page-main">
		<h1>Бот без явного функционала</h1>
		<p>Я действительно не могу описать его возможностей, ведь нет определённой задачи или темы к которой он был бы привязан.</p>
		<p>Нет и особо уникальных черт, ведь всё, что имеет этот бот уже когда-то существовало: проклятия, испытания, недо-экономика, общая казна, шуточные вещи, утилиты и другие вещи.</p>
		<p>
			<a href = { PagesRouter.relativeToPage( PagesRouter.getPageBy("commands").key ) }>Список команд.</a>
		</p>

		<hr style:margin-block = "10vh">
		

		<section style:height = "80vh">
			<Statistic/>
		</section>

		<h2>Статистика</h2>
		<section>
			<AuditDaily/>
		</section>

		<h2>Другие проекты</h2>
		<section>
			<p>Пожалуй, я займу это пространство своими хобби проектами, о которых вам может быть интересно узнать. Поймите правильно: иначе эта страница будет выглядить излишне пустой. Это весомое оправдание!</p>
			<hr>
			<AuthorProjects/>
		</section>
	</main>
	

	
</Layout>

<style>
	header 
	{
		display: flex;
		justify-content: start;
	}

	header element-wrapper
	{
		--padding: calc(5px + 0.75vw);
		border-radius: 30px;
		width: calc(10px + 20vw);
		height: calc(20vh + 10px);

		padding-bottom: var( --padding );
		border: var( --padding ) solid #88888811;
		background: var( --text-theme-accent );

		overflow: hidden;

		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	header element-wrapper img 
	{
		object-fit: cover;
		object-position: left;
		height: 100%;
		width: 100%;
	}



	header element-wrapper::after
	{
		content: '';
		position: absolute;
		bottom: 0;
		border: 2px solid var( --background-theme-accent );
		border-radius: 50%;
		width: calc( var(--padding) / 2 );
		aspect-ratio: 1 / 1;
		transform: translateY(50%);
	}

	.page-main > section
	{
		transition: opacity 2s, transform 0.5s;
		margin-bottom: 15vh;
	}

	.page-main > section:not(.visible)
	{
		transform: translateY(15%);
		opacity: 0;
	}



</style>

<script>
	import Layout from '#site-component/Layout';
	import {AuditDaily, Statistic} from '#site-component/frames/statistic';
	import AuthorProjects from '#site/components/frames/external/author/Projects.svelte';


  	import PagesRouter from '#site/lib/Router.js';
  	import { onMount } from 'svelte';

	const Component = {
		mainNode: null
	}
	const Interaction = {
		onIntersection(node, entries){
			node.classList.add("visible");
		}
	}
	onMount(() => {
		const sections = [...Component.mainNode.querySelectorAll(".page-main > section")];
		for (const sectionNode of sections){

			const observer = new IntersectionObserver(entries => {
				const intersecting = entries[0].isIntersecting;
				if (intersecting){
					Interaction.onIntersection(sectionNode, entries)
					observer.unobserve(sectionNode);
				}
			});

			observer.observe(sectionNode);
			continue;
		}
		
	})
</script>