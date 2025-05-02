<script>
	export let isAlwaysVisible = false

	import config from '#config'
	import svelteconst ROOT = 'src/public'App from '../../app_singleton.js'

	const isVisible = !svelteApp.storage.getSelectedLocale() || isAlwaysVisible
	const languages = config.i18n.availableLanguages

	function onClick() {
		svelteApp.storage.setLocale( this.textContent.toLowerCase() )
		document.location.reload()
		svelteApp.lang = svelteApp.storage.getSelectedLocale()
	}
</script>

{#if isVisible}
	<section>
		<ul>
			{#each languages as locale}
				<li title='Выбери меня'>
					<button on:click={onClick}>{locale}</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	ul {
		display: flex;
		list-style: none;
	}
	button {
		text-transform: uppercase;
		display: inline;
		background: none;
		font-family: monospace;
		padding: 0.5em;
		min-width: 20px;
		color: inherit;
	}

	button:hover {
		background-color: #88888822;
		text-decoration: underline;
	}
</style>
