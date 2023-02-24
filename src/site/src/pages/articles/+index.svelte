
<Layout>
	<group>
		<h1>Статьи</h1>
		<p>Что может быть хуже экспериментов ради экспериментов.. Эта часть сайта просто *существует* и, надеюсь, живёт своей жизнью. В будущем вы здесь найдете тексты раскрывающие возможности бота.</p>
	</group>
	
	<section>
		<h3>Создать</h3>
		<p>Чтобы написать статью авторизуйтесь и воспользуйтесь <a href = { PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/create").key) }>этой ссылкой</a>.</p>
	</section>

	<section class = "articles-list">
		<h3>Написанные статьи:</h3>
		<p>Количество файлов: { articlesPromise.filesCount ?? 0 }</p>
		{#await articlesPromise}
			<p>Загрузка...</p>
		{:then data}
			<input type="text" placeholder = " Фильтровать">
			<ul>
				{#each data as name}
					<li>{ name }</li>
				{/each}
			</ul>
		{:catch}
			<p>Загрузка неудалась</p>
		{/await}
	</section>
</Layout>


<style>
	a
	{
		color: var( --main-color );
	}

	.articles-list ul
	{
		display: flex;
		flex-wrap: wrap;
		gap: 30px;
		margin-top: 1em;
	}

	.articles-list li
	{
		display: block;
		background-color: #88888822;
		width: 300px;
		height: 200px;
		border-radius: 15px;
		padding: 20px;
	}

	input 
	{
		font-family: 'Icon', sans-serif;
		font-weight: 100;
		margin-top: 1em;
	}
</style>

<script>
	import Layout from '#site-component/Layout';
	import PagesRouter from '#site/lib/Router.js';
  	import { fetchFromInnerApi } from '#lib/safe-utils.js';

	const articlesPromise = (async () => {
		return fetchFromInnerApi("site/articles");
	})();

	articlesPromise
		.then(data => articlesPromise.filesCount = data.length);

</script>