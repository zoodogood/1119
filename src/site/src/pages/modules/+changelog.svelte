<script>
  import { dayjs, ending, fetchFromInnerApi } from "#lib/safe-utils.js";
  import Layout from "#site-component/Layout";

  const GroupSymbols = [
    { label: "Fix", symbol: "#", alias: ["fix", "bug"] },
    {
      label: "Balance change",
      symbol: "$",
      alias: ["balance", "balance change"],
    },
    {
      label: "Major",
      symbol: "!",
      alias: ["major", "important"],
    },
    { label: "Add feature", symbol: "+", alias: ["add feature", "feature"] },
    { label: "Improve", symbol: "%", alias: ["improve"] },
  ];

  const SeasonEmoji = ["⛄", "🌸", "☀️", "🍁"];

  const _interface_promise = (async () => {
    const changes = await fetchFromInnerApi(
      "modules/changelog_daemon/changelog",
    );
    const flat = changes.map(({ createdAt, change, message }) => {
      const period = dayjs(+createdAt).format("MM.YYYY");
      const lowed_change = change.toLowerCase();
      const group_base = GroupSymbols.find(({ alias }) =>
        alias.some((alias) => lowed_change.startsWith(alias)),
      );
      const group_symbol = group_base?.symbol || "x";
      const short_change = group_base ? change.replace(/^.+?:\s*/, "") : change;
      return {
        period,
        group_symbol,
        message,
        change,
        lowed_change,
        group_base,
        short_change,
      };
    });
    const first_change = changes[0];
    return { data: changes, flat, first_change };
  })();

  let filter_by_source_raw = "";
  let filter_queries = [];
  let filtered_flat = [];
  // eslint-disable-next-line prefer-const
  let flat = [];

  _interface_promise.then(({ flat: value }) => (flat = value));

  $: filter_queries = filter_by_source_raw.toLowerCase().split(" ");
  $: filtered_flat = flat.filter(changes_filter_factory(filter_queries));

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
      исключает источники со словами «bug» и «fix»</small
    >
    <h2>Список изменений</h2>
    <h5>
      Давайте посмотрим, что изменилось за последние {ending(
        dayjs
          .duration(Date.now() - _interface.first_change.createdAt)
          .get("months"),
        "месяц",
        "ев",
        "",
        "а",
      )}..
      <p>
        {ending(_interface.flat?.length, "изменени", "й", "е", "я")}:
      </p>
    </h5>
    <small symbols_list>
      <span>Условные обозначения:</span>
      {#each GroupSymbols.map(({ label, symbol }, i, array) => `${symbol} ・ ${label}${array.length - 1 !== i ? ", " : ""}`) as string}
        <span>{string}</span>
      {/each}
    </small>
    {#key filtered_flat}
      {#each Object.entries(Object.groupBy(filtered_flat, ({ period }) => period)).reverse() as [period, changes]}
        <p>
          <span period_emoji>
            {SeasonEmoji[Math.floor((+period.split(".")[0] + 2) / 4)]}
          </span>{period}
        </p>
        <ul>
          {#each Object.entries(Object.groupBy(changes, ({ group_symbol }) => group_symbol)) as [_, changes]}
            {#each changes as { short_change, group_symbol, message }}
              <li change_item change_item_symbol={group_symbol} title={message}>
                {short_change}.
              </li>
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
  [change_item] {
    font-size: 0.8em;
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    position: relative;
    align-items: center;
    justify-content: center;
    width: fit-content;
  }

  [change_item]::before {
    content: attr(change_item_symbol);
    font-family: "Icon", sans-serif;
    width: 1em;
    position: absolute;
    left: -1.05em;
    opacity: 0.8;
    color: var(--text-theme-accent);
    font-size: 0.8em;
    line-height: 0;
  }

  [change_item]:nth-child(2n) {
    color: color-mix(in srgb, currentColor, transparent 15%);
  }

  [period_emoji] {
    width: 1em;
  }

  [symbols_list] {
    display: flex;
    gap: 0.75em;
    flex-wrap: wrap;
    align-items: center;

    font-family: "Icon", sans-serif;
  }
</style>
