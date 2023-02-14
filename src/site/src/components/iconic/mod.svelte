<script>
	export let code = "";
</script>

<span class = "icon" data-symbol = { code }></span>

<style>
	.icon::after
	{
		font-family: 'Icons';
		content: attr(data-symbol);
	}
</style>