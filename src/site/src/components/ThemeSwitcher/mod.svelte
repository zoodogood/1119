
<button
class = "switch-theme"
data-current = { Theme.current }
on:click = { () => Theme.switchToNext() & CallBulbAnimation(node) }
bind:this = { node }
>
	<Icon code = ""/>
</button>

<style>
	.switch-theme
	{
		display: inline-block;
		cursor: pointer;
		opacity: 0.7;
		font-size: 1em;
		
		border-radius: 30px;
		padding: 0;
		width: fit-content;
		min-width: 0;

		transition: all 500ms;
	}

	.switch-theme[data-current="dark"]
	{
		color: var( --white );
	}

	.switch-theme[data-current="light"]
	{
		color: var( --dark );
		background-color: #ffffff44;
		opacity: 0.5;
	}

	.switch-theme[data-current="rainbow"]
	{
		transform: rotate(250deg);
	}

	.switch-theme:hover
	{
		opacity: 0.9;
	}
</style>

<script context="module">
	const DEFAULT_THEME = "darkGreen";
	
	const Theme = {
		current: localStorage.selectedTheme ?? DEFAULT_THEME,
		apply(themeName){
			const theme = Theme.collection.get(themeName);
			const target = document.documentElement.style;
			
			for (const style in theme){
				target.setProperty(style, theme[style]);
			}

			localStorage.selectedTheme = themeName;
		},

		remove(themeName){
			const theme = Theme.collection.get(themeName);
			const target = document.documentElement.style;
			
			for (const style in theme){
				target.removeProperty(style);
			}
		},

		switchToNext(){
			const themes = [...Theme.collection.keys()];
			const index = themes.indexOf(Theme.current);
			const themeName = themes.at((index + 1) % themes.length);

			const previousName = themes.at(index);
			Theme.remove(previousName);
			
			Theme.current = themeName;
			Theme.apply(themeName);
		},

		collection: themes
	}

	Theme.apply(Theme.current);
</script>

<script>
	import Icon from '#site-component/iconic';
	import BulbAnimation from './BulbAnimation.svelte';
	import themes from './themes.js';

	let node = null;

	function CallBulbAnimation(){
		new BulbAnimation({target: node});
	}
</script>


