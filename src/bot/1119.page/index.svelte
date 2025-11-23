<script>
	import Image from '#site-component/Image'
	import Layout from '#site-component/Layout'
	import { page_location } from '#src/site/build/components/lib/page_router_singleton.js'
	import AuthorProjects from '#src/site/build/components/svelte/frames/external/author/AuthorProjects.svelte'
	import { AuditDaily , Statistic } from '#src/site/build/components/svelte/frames/statistic/mod.js'
	import { onMount } from 'svelte'

	const Component = {
		mainNode: null ,
	}
	const Interaction = {
		onIntersection( node , entries ) {
			node.classList.add( 'visible' )
		} ,
	}
	onMount( () => {
		const sections = [
			... Component.mainNode.querySelectorAll( '.page-main > section' ) ,
		]
		for ( const sectionNode of sections ) {
			const observer = new IntersectionObserver( ( [ entry ] ) => {
				if ( entry.isIntersecting === false ) {
					return
				}

				Interaction.onIntersection( sectionNode , entry )
				observer.unobserve( sectionNode )
			} )

			observer.observe( sectionNode )
			continue
		}
	} )
</script>

<Layout>
	<header>
		<element-wrapper>
			<Image
				src='https://i.ibb.co/JrhvjFB/mute-command-gif.gif'
				alt='muteCommand'
				className='image_muteCommand'
			/>
		</element-wrapper>
	</header>

	<main bind:this={Component.mainNode} class='page-main'>
		<h1>Бот без явного функционала</h1>
		<p>
			Я действительно не могу описать его возможностей, ведь нет определённой
			задачи или темы к которой он был бы привязан.
		</p>
		<p>
			Нет и особо уникальных черт, ведь всё, что имеет этот бот уже когда-то
			существовало: проклятия, испытания, недо-экономика, общая казна, шуточные
			вещи, утилиты и другие вещи.
		</p>
		<p>
			<a
				href={page_location("commands")}
			>Список команд.</a
			>
		</p>

		<hr style:margin-block='10vh' />

		<section style:padding-top='20vh'>
			<Statistic />
		</section>

		<h2>Статистика:</h2>
		<section>
			<hr />
			<hr />
			<hr />
			<AuditDaily />
			<p style='font-size: 0.8em; opacity: 0.8; margin-top: 15vh;'>
				Нажмите на квадрат, чтобы увидеть подробную активность пользователей за
				конкретный день.
			</p>
			<span>👋</span>
		</section>

		<h2>Другие проекты</h2>
		<section style:container='none'>
			<hr />
			<hr />
			<hr />
			<p>
				Пожалуй, я займу это пространство своими хобби проектами, о которых вам
				может быть интересно узнать. Поймите правильно: иначе эта страница будет
				выглядить излишне пустой. Это весомое оправдание!
			</p>
			<AuthorProjects />
		</section>
	</main>
</Layout>

<style>
	header {
		display: flex;
		justify-content: start;
	}

	header element-wrapper {
		--padding: calc(7px + 0.5vw);
		border-radius: 30px;
		width: calc(10px + 20vw);
		height: calc(20vh + 10px);

		padding-bottom: var(--padding);
		border: var(--padding) solid #88888811;
		background: var(--text-theme-accent);

		overflow: hidden;

		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	header element-wrapper :global(.image_muteCommand) {
		object-fit: cover;
		object-position: left;
		height: 100%;
		width: 100%;
	}

	header element-wrapper::after {
		content: "";
		position: absolute;
		bottom: 0;
		border: 2px solid var(--background-theme-accent);
		border-radius: 50%;
		width: calc(var(--padding) / 2);
		aspect-ratio: 1 / 1;
		transform: translateY(50%);
	}

	.page-main {
		overflow: hidden;
	}

	.page-main > section {
		transition:
			opacity 2s,
			transform 0.5s;
		margin-bottom: 15vh;
		min-height: 20vh;

		container: section / inline-size;
	}

	.page-main > section:not(.visible) {
		transform: translateY(15%);
		opacity: 0;
	}
</style>
