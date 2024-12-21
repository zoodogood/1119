<script>
	let { svelteApp = null, target = {} } = $props();
</script>

<aside>
	<details>
		<summary><h2>Общие параметры</h2></summary>
		<element-group style:display="flex">
			<small>День рождения:</small>
			<input type="text" placeholder="31.12" />
		</element-group>
	</details>
</aside>

<style>
	aside {
		display: flex;
		gap: 0.5em;
	}

	h2 {
		font-size: 1.2em;
	}

	small {
		font-size: 0.5em;
	}

	summary h2 {
		display: inline-block;
	}
</style>
