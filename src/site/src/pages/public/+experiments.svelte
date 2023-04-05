<Layout>
	<h1>Эксперименты</h1>
	<element-embed>
		{ i18n.thisPageNotingTranslate }
	</element-embed>
	<p>Я не знаю кто на такое решится, но вы можете добавлять на эту страницу разные штуки, предлагая изменения на странице Гитхаба</p>
	<p>Практическая польза заключается в том, что я могу быстро вспомнить или проверить некоторую возможность. Для пользователей это место может оказаться бесполезным</p>
	
	<section>
		<button on:click = { createNotification }>Создать уведомление</button>
		<button on:click = { createDialog }>Создать диалог</button>
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

	import { getNotificationsContext } from 'svelte-notifications';
	const { addNotification } = getNotificationsContext();
	import svelteApp from '#site/core/svelte-app.js';
	

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