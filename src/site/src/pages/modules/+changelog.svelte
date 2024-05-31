<script>
  import { dayjs, ending, fetchFromInnerApi } from "#lib/safe-utils.js";
  import Layout from "#site-component/Layout";

  const _interface_promise = (async () => {
    const changes = await fetchFromInnerApi(
      "modules/changelog_daemon/changelog",
    );
    console.log({ changes });
    const flat = changes.map(({ createdAt, change, message }) => {
      const period = dayjs(+createdAt).format("MM.YYYY");
      const groupName = change.match(/^(\S+):/)?.[1];
      return { period, groupName, message, change };
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
    ({ message }) =>
      !queries ||
      queries.every((query) =>
        query.startsWith("!")
          ? !message.toLowerCase().includes(query.slice(1))
          : message.toLowerCase().includes(query),
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
        Количество: {ending(_interface.flat?.length, "изменени", "й", "е", "я")}
      </p>
    </h5>
    {#key filtered_flat}
      {#each Object.entries(Object.groupBy(filtered_flat, ({ period }) => period)) as [period, changes]}
        <p>{period}</p>
        {#each changes as { message, change }}
          <ul>
            <li title={message}>{change}</li>
          </ul>
        {/each}
      {/each}
    {/key}
  {:catch error}
    {console.info(error) || error}
  {/await}
</Layout>

<style>
  [resource_paragpraph] {
    text-transform: capitalize;
    position: sticky;
    top: 0;
  }

  [resource_group_element] {
    font-size: 0.8em;
    display: flex;
    flex-wrap: wrap;
  }

  [resource_group_element]:nth-child(2n) {
    color: color-mix(in srgb, currentColor, transparent 15%);
  }

  [resource_group_element_key] {
    width: 70%;
  }
  [resource_group_element_value] {
    width: 30%;
    text-align: center;
  }
</style>
