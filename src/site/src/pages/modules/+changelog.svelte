<script>
  import { group_changes } from "#lib/ChangelogDaemon/api/display.js";
  import { metadata } from "#lib/ChangelogDaemon/api/metadata.js";
  import { dayjs, ending, fetchFromInnerApi } from "#lib/safe-utils.js";
  import Layout from "#site-component/Layout";

  const SeasonEmoji = ["⛄", "🌸", "☀️", "🍁"];

  const _interface_promise = (async () => {
    const changes = await fetchFromInnerApi(
      "modules/changelog_daemon/changelog",
    );
    const flat = changes.map(metadata);
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
      исключает источники, включающие «bug» и «fix»</small
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

    {#key filtered_flat}
      {#each group_changes(filtered_flat) as [period, byPeriod]}
        <p>
          <span period_emoji>
            {SeasonEmoji[Math.floor((+period.split(".")[0] + 2) / 4)]}
          </span>{period}
        </p>
        <ul>
          {#each byPeriod as [group_base, byGroupSymbol]}
            <p group_label>
              {group_base?.label}
            </p>
            {#each byGroupSymbol as { short_change, group_symbol, message, createdAt }}
              <li
                change_item
                change_item_symbol={group_symbol}
                title={message}
                id={`change_${short_change}_${createdAt}`}
              >
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
    --font-size: 0.8rem;
    --line-height: 1.2;
    font-size: var(--font-size);
    line-height: var(--line-height);
    flex-wrap: wrap;
    list-style: none;
    position: relative;
    text-align: justify;
  }

  [change_item]::before {
    content: attr(change_item_symbol);
    font-family: "Icon", sans-serif;
    width: 1em;
    position: absolute;
    left: calc(var(--font-size) * -1.05);
    opacity: 0.8;
    color: var(--text-theme-accent);
    font-size: 0.65rem;
    height: calc(var(--font-size) * var(--line-height));

    display: flex;
    align-items: center;
    justify-content: center;
  }

  [change_item]:nth-child(2n) {
    color: color-mix(in srgb, currentColor, transparent 15%);
  }

  [period_emoji] {
    width: 1em;
  }

  [group_label] {
    font-size: 0.55em;
    font-weight: 300;
  }
</style>
