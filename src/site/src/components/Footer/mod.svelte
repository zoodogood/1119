<script>
	import appSvelte from '#site/core/svelte-app.js';
	
	const bot = appSvelte.getBot();
</script>




<footer class = "container">
	<main class = "footer-main">

		 <section class = "article">
			  <aside class = "article-aside article-title">
					<h2 class = "article-aside-header">Представьте себе...</h2>
					<p class = "article-aside-paragraph">Expented 2022</p>
			  </aside>
			  <section class = "article-information_section group">
					<aside class = "article-aside">
						 <h3 class = "article-aside-header">Информация</h3>
						 <ul class = "article-aside-list">
							  <li><a href = "">Политика использования</a></li>
							  <li><a href = "">Благодарности</a></li>
							  <li><a href = "">1119</a></li>
							  <li></li>
						 </ul>
					</aside>
					<aside class = "article-aside">
						 <h3 class = "article-aside-header">Навигация</h3>
						 <ul class = "article-aside-list">
							  <li><a href = "">Пригласить</a></li>
							  <li><a href = "">Дискорд</a></li>
							  <li><a href = "">Гитхаб</a></li>
							  <li><a href = "">Помощь</a></li>
						 </ul>
					</aside>
			  </section>
		 </section>


		 <section class = "bottom-container">
			  <hr class = "bottom-horizontal_line">
			  <header class = "build-info">
				<span>При поддержке Expented; Версия: V2.0.0; Сборка от 15.02.2023 14:20</span>
			</header>

			  <main class = "bottom-main">
					

					<aside class = "bottom-main-title">
						 <span class = "bot-icon">
							  <img src={ bot.displayAvatarURL } alt="bot avatar">
						 </span>
						 <span>{bot.username}</span>
					</aside>

					<aside class = "invite">
						 <a href={ bot.invite }>
							<button>Пригласить</button>
						</a>
					</aside>
			  </main>

			  	
		 </section>


	</main>
</footer>


<style>

	footer::before
	{
		content: '';
		background-color: var( --text-theme-accent );
		opacity: 0.1;
		display: block;
		position: absolute;
		top: -4em;
		left: 4em;
		
		width: 1.5em;
		aspect-ratio: 1 / 1;
		border-radius: 0.7em;
		border-radius: 2em;

		transition: opacity 1s;;
	}

	footer:hover::before
	{
		content: '';
		opacity: 0.5;
	}


	.container 
	{	
		margin-top: 50vh;
		background: var( --background-theme-accent );
		position: relative;
		filter: var( --page-filter );
		border-top: 2px solid var( --main-color );
	}

	.footer-main 
	{
		display: flex;
		width: 100%;
		background-color: #deeefc15;

		flex-direction: column;
	}


	.article
	{
		flex-grow: 3;

		gap: 80px;

		line-height: 1.2;
		font-weight: 300;
	}

	.article-aside-header
	{
		color: var( --main-color );
		margin-bottom: 30px;
		font-weight: 400;
	}

	.article-information_section
	{
		display: flex;
		gap: 80px;
		flex-wrap: wrap;
	}


	.article-aside-list
	{
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 0.8em;
	}

	.article, .bottom-main, .build-info
	{
		width: 100%;
		padding: calc(20px + 1vw);
		padding-right: calc(30px + 1vw);

		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}


	.bottom-container
	{
		display: flex;
		flex-direction: column;

		width: 100%;
		flex-grow: 1;
	}

	.bottom-main
	{
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 40px;

		font-weight: 100;
	}

	.bottom-horizontal_line
	{
		background-color: var( --text-theme-accent );
		width: 100%;
		height: 2px;
	}

	.article-title
	{
		margin-right: 400px;
	}

	.article-title > .article-aside-header
	{
		font-size: 2em;
	}

	.bottom-main-title
	{
		display: flex;
		align-items: center;
		gap: 10px;

		font-weight: 500;
	}

	.build-info
	{
		font-size: 0.4em;
		font-family: monospace;
		padding-block: 0;
		opacity: 0.2;

		transition: opacity 1s;
		max-height: 0;
		overflow: visible;
	}

	.build-info > span
	{
		padding-top: 5px;
		cursor: default;
	}

	.build-info:hover
	{
		opacity: 1;
	}

	.bot-icon 
	{
		width: 2em;
		aspect-ratio: 1 / 1;
		border-radius: 20px;
		display: flex;
	}

	.bot-icon img 
	{
		border-radius: 0.5em;
	}
</style>