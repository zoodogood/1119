<script>
	export let svelteApp = null ,
		target = {}

	import Icon from '#site-component/iconic'
	import Progressbar from '#site-component/Progressbar'
	import { fetchFromInnerApi } from '#src/http_requests/fetchFromInnerApi.js'
	import { EXPERIENCE_PER_LEVEL } from '#src/level/constants.js'
	import { NumberFormatLetterize } from '#src/safe-utils.js'
	import Wrapper from '#src/site/build/components/svelte/frames/entityData/wrapper.svelte'
	import { onMount } from 'svelte'

	const Component = {
		async getData() {
			const headers = { Authorization: svelteApp.storage.getToken() }
			const userData = await fetchFromInnerApi( 'user/data' , { headers } )

			return userData
		} ,
	}

	const State = {
		user: {
			level: 0 ,
			experience: 0 ,
			coins: null ,
		} ,
	}
	onMount( async () => {
		const userData = await Component.getData()
		if ( !userData.id ) {
			return
		}

		console.log( target )

		State.user.level = userData.level
		State.user.experience = userData.exp
		State.user.coins = userData.coins
	} )
</script>

<Wrapper>
	<element-group style:width='30%' style:min-width='200px'>
		<Progressbar
			value={State.user.experience}
			max={( State.user.level || 1 ) * EXPERIENCE_PER_LEVEL}
			targetLabel='{State.user.level} ур.'
		/>
	</element-group>

	<element-group>
		<element-container title='Богатств'>
			<span style:color='#88888888'><Icon code='' /></span>
			{NumberFormatLetterize( State.user.coins )}
		</element-container>
	</element-group>
</Wrapper>

<style>
</style>
