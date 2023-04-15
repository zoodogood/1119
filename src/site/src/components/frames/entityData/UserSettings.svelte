<Wrapper>
	
	<aside>
		<details>
			<summary><h2>Общие параметры</h2></summary>
			<element-group>
				<small>День рождения:</small>
				<input type="text" placeholder = "31.12">
			</element-group>
		</details>
		
	</aside>
</Wrapper>


<style>
	aside
	{
		display: flex;
		gap: 0.5em;
	}

	h2
	{
		font-size: 1.2em;
	}
	
	small
	{
		font-size: 0.5em;
	}
</style>


<script>
	export let 
		svelteApp = null,
		target = {};

	import Wrapper from "./wrapper.svelte";
</script>