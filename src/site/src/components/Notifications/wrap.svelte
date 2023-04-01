<Notifications>
	<slot></slot>
</Notifications>

<style>
	:global(.notification)
	{
		filter: brightness(0.7) contrast(0.9) opacity(0.9);
		color: var( --white ) !important;
		background-color: var( --main-color ) !important;
		border-radius: 100vw !important;
		padding-left: 1em !important;
		min-width: 400px !important;

		transition: filter 200ms;
	}

	:global(.notification:hover)
	{
		filter: none;
	}

	:global(.notification-content)
	{
		width: 350px !important;
		font-size: 0.9em !important;
	}

	:global(.notification-button)
	{
		color: var( --white ) !important;
		border: none !important;
	}
</style>

<script>
	import Notifications from "svelte-notifications";
</script>