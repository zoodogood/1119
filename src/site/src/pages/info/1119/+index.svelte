<Layout>
	<header>
		<span>
			<iframe src="https://greenghost.mooo.com:8119/pages/secretpage" title = "x" frameborder="0"></iframe>
		</span>
	</header>
	
</Layout>

<style>
	header 
	{
		display: flex;
		justify-content: center;
	}
	iframe
	{
		border-radius: 30px;
		width: 50vw;
		height: 50vh;

		padding-bottom: 10px;
		border: 10px solid var( --text-theme-accent );
		background: var( --text-theme-accent );
	}

	span 
	{
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	span::after
	{
		content: '';
		position: absolute;
		bottom: 10px;
		border: 2px solid var( --background-theme-accent );
		border-radius: 50%;
		width: 5px;
		aspect-ratio: 1 / 1;
		transform: translateY(50%);
	}
</style>

<script>
	import Layout from '#site-component/Layout';
</script>