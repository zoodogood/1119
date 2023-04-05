<Layout>
	<header>
		<span>
			<img src = "https://images-ext-2.discordapp.net/external/fBq1I0O3Tdhoi-DeVVm7nDadXN-uzdgKveyekp-Vm88/https/media.discordapp.net/attachments/769566192846635010/872776969341796382/mute.gif" alt = "muteCommand">
		</span>
	</header>

	<h1>Бот без явного функционала</h1>
	<p>Я действительно не могу описать его возможностей, ведь нет определённой задачи или темы к которой он был бы привязан.</p>
	<p>Нет и особо уникальных черт, ведь всё, что имеет этот бот уже когда-то существовало: проклятия, испытания, недо-экономика, общая казна, шуточные вещи, утилиты и конечно же модеративные команды.</p>
	<p>
		<a href = { PagesRouter.relativeToPage( PagesRouter.getPageBy("commands").key ) }>Список команд.</a>
	</p>

	<h3>Почему "это" всё-ещё существует.</h3>
	<p>Этого бота зовут Призрак. — Захотелось так. И я уже смирился с тем, что он важен для меня и людей, которые дают понять, что он им не безразличен.</p>
	<p>Поэтому он будет продолжать жить и иногда обновляться пока мир не помешает этому. Так что не дождётесь, хейтеры.</p>
	
	<h3>Эй! Давай больше обновлений!</h3>
	<p>Кусь вам, ведь я хочу заниматься чем-то новым!</p>

	<h2>Статистика</h2>
	<section>
		<p>Я осмелюсь прорекламировать здесь другие свои хобби проекты</p>
	</section>

	
</Layout>

<style>
	header 
	{
		display: flex;
		justify-content: start;
	}

	header span
	{
		--padding: 10px;
		border-radius: 30px;
		width: 20vw;
		height: 20vh;

		padding-bottom: var( --padding );
		border: var( --padding ) solid #88888811;
		background: var( --text-theme-accent );

		overflow: hidden;

		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;

		/* clip-path: polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%); */
		/* clip-path: polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%); */
	}

	header span img 
	{
		object-fit: cover;
		object-position: left;
		height: 100%;
		width: 100%;
	}



	header span::after
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
</style>

<script>
	import Layout from '#site-component/Layout';
  import PagesRouter from '#site/lib/Router.js';
</script>