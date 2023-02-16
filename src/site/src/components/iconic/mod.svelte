<script>
	export let code = "";
</script>

<span class = "icon" data-symbol = { code }></span>

<style>
	@font-face {
		font-family: 'Icon';
		src:
			url('/static/resources/fonts/fontello/fonts/item.eot') format('embedded-opentype'),
			url('/static/resources/fonts/fontello/fonts/item.woff2') format('woff2'),
			url('/static/resources/fonts/fontello/fonts/item.woff') format('woff'),
			url('/static/resources/fonts/fontello/fonts/item.ttf') format('truetype'),
			url('/static/resources/fonts/fontello/fonts/item.svg') format('svg');

		font-weight: normal;
		font-style: normal;
	}

	.icon::after
	{
		font-family: "Icon";
		content: attr(data-symbol);

		
		font-style: normal;
		font-weight: normal;

		display: inline-block;
		text-decoration: inherit;
		width: 1em;
		text-align: center;
		/* opacity: .8; */

		/* For safety - reset parent styles, that can break glyph codes*/
		font-variant: normal;
		text-transform: none;

		/* fix buttons height, for twitter bootstrap */
		line-height: 1em;


		/* you can be more comfortable with increased icons size */
		/* font-size: 120%; */

		/* Font smoothing. That was taken from TWBS */
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>