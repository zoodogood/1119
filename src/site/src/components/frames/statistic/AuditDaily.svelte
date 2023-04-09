<element-container class = "component" style:--main-color = { State.mainColor }>
	<nav><ul>
		{#each [...Component.auditTypeEnum] as element, index}
			{@const [key, { icon, label }] = element}
			<li title = { label }>
				<button on:click = { () => State.selectedAuditTypeIndex = index }>
					<Icon code = { icon }/>
				</button>
			</li>
		{/each}
	</ul></nav>
	<main>
		{#await State.dataPromise}
			<p>Загрузка</p>
		{:then} 
			<h4>{ [...Component.auditTypeEnum.values()].at( State.selectedAuditTypeIndex ).label }:</h4>
			<element-container class = "heatmap" on:click = { Component.heatMapOnClick } on:keydown = { Component.heatMapOnClick }>
				<Heatmap {...HeatmapState}/>
			</element-container>
		{/await}
		
	</main>
	{#key State.footerLabel}
		<footer>{ State.footerLabel }</footer>
	{/key}
</element-container>

<style>
	.component
	{
		flex-direction: column;
		container: AuditDaily / inline-size;
	}
	nav ul 
	{
		display: flex;
		height: 2em;
		width: 100%;
		list-style: none;
		background-color: #88888822;
	}

	nav ul li
	{
		flex-grow: 1;
		flex-shrink: 1;
		width: 3em;
		max-width: 5em;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: end;
	}

	nav ul li:hover
	{
		background-color: #88888833;
	}

	nav ul li button
	{
		height: 110%;
		margin: 0.3em;
	}

	.heatmap
	{
		height: 20vh;
	}

	footer 
	{
		white-space: pre-line;
		animation: footer-apparance 1000ms;
	}

	@keyframes footer-apparance
	{
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}
</style>


<script>
	import Icon from '#site-component/iconic';
	import Heatmap from 'svelte-heatmap';

	import { dayjs, fetchFromInnerApi } from '#lib/safe-utils.js';
  	import { Theme } from '#site/components/ThemeSwitcher/mod.svelte';
  	import svelteApp from '#site/core/svelte-app.js';

	const Component = {
		auditTypeEnum: new Map(Object.entries({
			enterToPages: {
				icon: "",
				label: "Посещений страниц",
				colorTheme: Theme.collection.get("darkGreen")["--main-color"]
			},
			enterToAPI: {
				icon: "",
				label: "Обращений к API",
				colorTheme: Theme.collection.get("darkOrange")["--main-color"]
			},
			commandsUsed: {
				icon: "",
				label: "Использованно команд",
				colorTheme: Theme.collection.get("darkPurple")["--main-color"]
			},
			messages: {
				icon: "",
				label: "Сообщений",
				colorTheme: Theme.collection.get("darkBlue")["--main-color"]
			}

		})),

		async GetData(){
			const data = await fetchFromInnerApi("client/audit/daily");
			const entries = Object.entries( data )
				.map(([day, data]) => [day * 86_400_000, data]);

			const collection = new Map(entries);
			State.data = collection;
			return collection;
		},

		heatMapOnClick(clickEvent){
			const target = clickEvent.target;
			if (target.tagName === "rect"){
				State.footerLabel = `Выбранный элемент:\nЗначение: ${ target.getAttribute("data-value") };\nДата: ${ target.getAttribute("data-date") }`
			}
		}
	}

	const State = {
		displayContent: "",
		selectedAuditTypeIndex: 0,
		dataPromise: Component.GetData(),
		data: null,
		mainColor: null,
		footerLabel: ""
	}

	const HeatmapState = {
		emptyColor: "#88888822",
		colors: ["#00000022", "#88888822", "ffffff22"],
		data: [],
		monthLabels: [...new Array(12)].map((_, i) => 
			new Intl.DateTimeFormat(svelteApp.lang, {month: "short"}).format(dayjs().set("month", i).toDate())
		),
		dayLabels: [...new Array(7)].map((_, i) => 
			new Intl.DateTimeFormat(svelteApp.lang, {weekday: "short"}).format(dayjs().set("day", i + 1).toDate())
		),

		allowOverflow: true,
		monthGap: 20,
		view: "monthly"
	}

	$: if (State.data){
		HeatmapState.startDate ||= 
			dayjs([...State.data.keys()].at(0)).toDate();

		HeatmapState.endDate ||=
			dayjs([...State.data.keys()].at(-1)).toDate();

		
		const key = [...Component.auditTypeEnum.keys()].at(State.selectedAuditTypeIndex);
		HeatmapState.data = [...State.data.entries()].map(([timestamp, raw]) => ({
			date: dayjs(timestamp).toDate(),
			value: raw[ key ]
		}));
	}

	$: {
		((index) => {
			State.mainColor = [...Component.auditTypeEnum.values()].at( index ).colorTheme;
			const MIN_ALPHA = 3;
			const toColor = (_, i) => {
				const alpha = (i + MIN_ALPHA).toString(16).repeat(2);
				return `${ State.mainColor }${ alpha }`;
			}
			HeatmapState.colors = [...new Array(16 - MIN_ALPHA)].map(toColor);
		})(State.selectedAuditTypeIndex)
	}
</script>