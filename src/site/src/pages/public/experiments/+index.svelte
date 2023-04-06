<Layout>
	<h1>Эксперименты</h1>
	<p>Я не знаю кто на такое решится, но вы можете добавлять на эту страницу разные штуки, предлагая изменения на странице Гитхаба</p>
	<p>Практическая польза буквально заключается в том, что я могу быстро вспомнить или проверить некоторую возможность. Для пользователей это место может оказаться бесполезным</p>
	<element-embed>
		<p>Вы действительно можете вносить изменения в каталоге, <a target = "_blank" rel = "noreferrer" href = "{ config.enviroment.github }/tree/{ config.enviroment.branch }/src/site/src/pages/public/experiments">experiments</a>:</p>
		<p>Создавать новые файлы и редактировать существующие. Изменения будут приняты и позднее отображены на этой странице.</p>
		<p>Ограничения существуют по принципу морали и безопасности. Другие пользователи могут удалять ваши изменения по тем же принципам.</p>
		<p>Подробнее см. в файле <code>readme.md</code> того же каталога.</p>
	</element-embed>
	
	<section>
		<button on:click = { createNotification }>Создать уведомление</button>
		<button on:click = { createDialog }>Создать диалог</button>
	</section>

	<section class = "comments-container">
		<Giscus tag = "special: experiments"/>
	</section>

</Layout>

<style>
	button
	{
		display: inline-block;
	}
</style>


<script>
	import Layout from '#site-component/Layout';
	import Dialog from '#site-component/Dialog';
	import Giscus from '#site-component/Giscus';

	import { getNotificationsContext } from 'svelte-notifications';
	const { addNotification } = getNotificationsContext();
	import svelteApp from '#site/core/svelte-app.js';
  	import config from '#config';
	

	const i18n = svelteApp.i18n.pages.publicExperiments;

	function createNotification(){
		addNotification({text: "Кто придумывал этот дизайн? Он плох!", position: "bottom-center"});
	}

	function createDialog(){
		new Dialog({
			target: document.body,
			props: {title: "Стандартный диалог", description: "И такое бывает", useClassic: true}
		});
	}
</script>