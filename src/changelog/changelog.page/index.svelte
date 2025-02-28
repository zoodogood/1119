<script>
	import Layout from "#site-component/Layout";
	import { group_changes_by_default } from "#src/changelog/ChangelogDaemon/display.js";
	import { metadata } from "#src/changelog/ChangelogDaemon/metadata.js";

	import { fetchFromInnerApi } from "#src/http_requests/fetchFromInnerApi.js";
	import { season_of_month } from "#src/safe-utils.js";
	import { ending } from "@zoodogood/utils/primitives";

	import { dayjs } from "#src/dayjs.js";
	import ChangeItem from "./change_item.svelte";

	const SeasonEmoji = ["⛄", "🌸", "☀️", "🍁"];

	const _interface_promise = (async () => {
		const changes = await fetchFromInnerApi("changelog");
		console.log(changes);

		return {
			data: changes,
			flat: changes.map(metadata),
			first_change: changes[0],
		};
	})();

	let filter_by_source_raw = "";
	let filter_queries = [];
	let filtered_flat = [];

	let flat = [];

	_interface_promise.then(({ flat: value }) => (flat = value));

	$: filter_queries = filter_by_source_raw.toLowerCase().split(" ");
	$: filtered_flat = flat.filter(changes_filter_factory(filter_queries));

	console.log({ dayjs });

	const changes_filter_factory =
		(queries) =>
		({ lowed_change }) =>
			!queries ||
			queries.every((query) =>
				query.startsWith("!")
					? !lowed_change.includes(query.slice(1))
					: lowed_change.includes(query),
			);
</script>

<Layout>
	{#await _interface_promise}
		Грузимся...
	{:then _interface}
		<input
			type="text"
			placeholder="Фильтровать по сообщению"
			bind:value={filter_by_source_raw}
		/>
		<small
			>— используйте «!» при поиске для исключения, например, !bug !fix, —
			исключает источники, включающие «bug» и «fix»</small
		>
		<h2>Список изменений</h2>
		<h5>
			Давайте посмотрим, что изменилось за {ending(
				dayjs
					.duration(Date.now() - _interface.first_change.createdAt)
					.get("months") + 1,
				"месяц",
				"ев",
				"",
				"а",
			)}..
			<p>
				{ending(_interface.flat?.length, "изменени", "й", "е", "я")}:
			</p>
		</h5>

		{#key filtered_flat}
			{#each group_changes_by_default(filtered_flat) as [period, byPeriod]}
				<p>
					<span period_emoji>
						{SeasonEmoji[season_of_month(+period.split(".")[0])]}
					</span>{period}
				</p>
				<ul>
					{#each byPeriod as [group_base, byGroupSymbol]}
						<p group_label>
							{group_base?.label}
						</p>
						{#each byGroupSymbol as { short_change, group_symbol, message, commit_id, createdAt, change, uid }}
							<ChangeItem
								{short_change}
								{group_symbol}
								{message}
								{commit_id}
								{createdAt}
								{change}
								{uid}
							/>
						{/each}
						<br />
					{/each}
					<hr style="width: 100%;" />
				</ul>
			{/each}
		{/key}
	{:catch error}
		{console.info(error) || error}
	{/await}
</Layout>

<style>
	[period_emoji] {
		width: 1em;
	}

	[group_label] {
		font-size: 0.55em;
		font-weight: 300;
	}
</style>
