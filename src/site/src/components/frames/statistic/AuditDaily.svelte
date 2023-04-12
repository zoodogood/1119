<element-container class = "component" style:--main-color = { State.mainColor }>
	<nav>
		<ul class = "select-audit-list">
		{#each [...Component.auditTypeEnum] as element, index}
			{@const [key, { icon, label }] = element}
			<li
				class = "select-audit-item"
				class:active = { State.selectedAuditTypeIndex === index }
				title = { label }
				on:click = { () => State.selectedAuditTypeIndex = index }
				on:keydown = { () => State.selectedAuditTypeIndex = index }
			>
				<button>
					<Icon code = { icon }/>
				</button>
			</li>
		{/each}
		</ul>
	</nav>
	<main>
		{#await State.dataPromise}
			<element-embed>
				<Loader width = "100px"/>
			</element-embed>
		{:then} 
			
			<main class = "heatmap">
				<element-container
					class = "heatmap-inner-container"
					on:click = { Component.heatMapOnClick }
					on:keydown = { Component.heatMapOnClick } 
				>
					<Heatmap {...HeatmapState}/>
				</element-container>
			</main>
		
			<section>
				<element-group>
					<h4>{ i18n.section.selectionGroup.label }</h4>
					<p>
						{ [...Component.auditTypeEnum.values()].at( State.selectedAuditTypeIndex ).label }
						<element-svg/>
					</p>
				</element-group>
				
				<element-group>
					<h4>{ $ComponentSectionManagerWritableStore.footerLabel }:</h4>
					{ @html $ComponentSectionManagerWritableStore.footerContent }
				</element-group>
			</section>
		{:catch}
			<element-embed>
				{ i18n.serverIsNotAvailable }
			</element-embed>
		{/await}
	</main>
	
</element-container>

<style>
	.component
	{
		flex-direction: column;
		container: AuditDaily / inline-size;
		margin-top: 1em;
	}

	

	.select-audit-list
	{
		display: flex;
		height: calc(1em + 0.5vw);
		width: fit-content;
		list-style: none;
		background-color: #88888822;
	}

	.select-audit-item
	{
		flex-grow: 1;
		flex-shrink: 1;
		width: 3em;
		max-width: calc(5em + 0.5vw);
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: end;
	}

	.select-audit-item:hover
	{
		background-color: #88888833;
	}

	.select-audit-item button
	{
		height: 110%;
		margin: 0.3em;
		min-width: 75%;

		transition: margin 500ms, filter 500ms;
		filter: brightness(0.8);
	}

	.select-audit-item.active button
	{
		margin-bottom: 0.5em;
		filter: brightness(1);
	}

	.select-audit-item:hover button
	{
		margin-bottom: 0.7em;
		filter: brightness(1);
	}


	.component > main 
	{
		display: flex;
		flex-wrap: wrap;
		
		gap: 2em;
	}

	.component > main > section
	{
		margin-left: auto;
		opacity: 0.7;
		font-weight: 100;
		text-transform: uppercase;
		font-size: 0.8em;
		padding-left: 2em;

		display: flex;
		flex-direction: column;
		gap: 1em;

		min-height: 100%;
		justify-content: center;
	}

	.component > main > section h4
	{
		font-weight: 100;
		font-size: 1.5em;
		transform: translateX(-1em);
	}

	.component > main > section element-svg
	{
		display: inline-block;
		width: 0.5em;
		aspect-ratio: 1;
		background-color: var( --main-color );
		margin-inline: 0.5em;
		vertical-align: middle;
	}

	main > element-embed 
	{
		margin-top: 1em;
	}

	.heatmap
	{
		overflow-x: auto;
	}

	.heatmap-inner-container
	{
		--size: 20vh;
		height: var( --size );
		overflow-x: auto;
		box-sizing: content-box;
		padding-block: 1em;
		flex-shrink: 0;

		width: fit-content;
		max-width: none;
	}

	@media (min-width: 980px){
		.component > main > section
		{
			transform: translateY(-3em);
			flex-direction: column;
		}
	}

	@media (max-width: 980px){
		.component > main > section
		{
			flex-grow: 1;
			align-items: center;
			justify-content: space-around;
			flex-direction: row;
			flex-wrap: wrap;
		}
	}

</style>


<script>
	import Icon from '#site-component/iconic';
	import Heatmap from 'svelte-heatmap';
	import Loader from '#site-component/Loader';

	import { dayjs, fetchFromInnerApi, timestampDay, NumberFormatLetterize } from '#lib/safe-utils.js';
  	import { Theme } from '#site/components/ThemeSwitcher/mod.svelte';
  	import svelteApp from '#site/core/svelte-app.js';
  	import { writable } from 'svelte/store';

	
	const i18n = svelteApp.i18n.frames.AuditDaily;

	class ComponentSectionManager {
		constructor(){
			this.state = {
				footerLabel: "",
				footerContent: "",
				data: null,
				focusedHeat: null
			}

			this.store = writable(this.state);
		}

		setFocusedHeat(target){
			const date = new Date(target.getAttribute("data-date"));
			const key = timestampDay(date.getTime()) * 86_400_000;

			
			this.state.focusedHeat = {
				target: target,
				key,
				date
			}

			this.update();
		}

		removeFocusedHeat(){
			delete this.state.focusedHeat;
			this.update();
		}

		setData(data){
			this.state.data = data;
			this.update();
		}

		update(){
			const state = this.state;
			if (!state.data){
				return;
			}

			if (state.focusedHeat && state.data){
				const heat = state.focusedHeat;
				const values = state.data.get(heat.key) ?? {};
				
				const content = this.valuestToContent(values);

				state.footerLabel = `${ i18n.SectionManager.footerLabels.for$day } ${ dayjs(heat.date).format("DD.MM") }`;
				state.footerContent = content;

				this.store.update(() => this.state);
				return;
			}

			if (state.data){
				
				const values = [...state.data.values()]
					.reduce((acc, value) => {
						for (const key in value)
						acc[key] = (acc[key] ?? 0) + value[key];

						return acc;
					}, {});

				const content = this.valuestToContent(values);
				state.footerLabel = i18n.SectionManager.footerLabels.general;
				state.footerContent = content;

				this.store.update(() => this.state);
				return;
			}
		}

		valuestToContent(values){
			if (!Object.keys(values).length){
				return i18n.SectionManager.emptyContent;
			}
			
			const content = Object.entries(values)
				.map(([key, value]) => `${ Component.auditTypeEnum.get(key).label }: ${ NumberFormatLetterize(value) }`)
				.map(content => `<p>${ content }</p>`)
				.join(""); 

			return content;
		}
	}



	const Component = {
		auditTypeEnum: new Map(Object.entries({
			enterToPages: {
				icon: "",
				label: i18n.auditTypeEnum.enterToPages.label,
				colorTheme: Theme.collection.get("darkGreen")["--main-color"]
			},
			enterToAPI: {
				icon: "",
				label: i18n.auditTypeEnum.enterToAPI.label,
				colorTheme: Theme.collection.get("darkOrange")["--main-color"]
			},
			commandsUsed: {
				icon: "",
				label: i18n.auditTypeEnum.commandsUsed.label,
				colorTheme: Theme.collection.get("darkPurple")["--main-color"]
			},
			messages: {
				icon: "",
				label: i18n.auditTypeEnum.messages.label,
				colorTheme: Theme.collection.get("darkBlue")["--main-color"]
			},
			riches: {
				icon: "",
				label: i18n.auditTypeEnum.riches.label,
				colorTheme: "##ffd700"
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

		async heatMapOnClick(clickEvent){
			// to-do: Transform to popup on element
			const target = clickEvent.target;
			if (target.tagName === "rect"){
				Component.SectionManager.setFocusedHeat(target);

				target.style.fill = "var(--main-color)";
				target.style.filter = "invert(1)";
				const {target: clickTarget} = await new Promise(resolve => document.addEventListener("pointerdown", resolve, {once: true}));
				if (clickTarget.tagName !== "rect"){
					Component.SectionManager.removeFocusedHeat();
				}

				target.style.fill = "";
				target.style.filter = "";
			}
		},

		SectionManager: new ComponentSectionManager()
	}

	const State = {
		displayContent: "",
		selectedAuditTypeIndex: 0,
		dataPromise: Component.GetData(),
		data: null,
		mainColor: null
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
		view: "monthly",
		fontColor: "var( --text-theme-accent )",
		fontFamily: "monospace",
		fontSize: "0.2em"
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

		
		Component.SectionManager.setData(State.data);
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

	const ComponentSectionManagerWritableStore = Component.SectionManager.store;
</script>