<script>
  import { sortByResolve } from "#lib/mini.js";
  import { NumberFormatLetterize, fetchFromInnerApi } from "#lib/safe-utils.js";
  import Layout from "#site-component/Layout";

  const _interface_promise = (async () => {
    const data = await fetchFromInnerApi("client/audit/resources");
    const resources = new Set();
    const sources = [];
    const flat_list = [];
    for (const [source, changes] of Object.entries(data)) {
      Object.keys(changes).forEach((value) => resources.add(value));
      sources.push(source);

      for (const [resource, variants] of Object.entries(changes)) {
        // eslint-disable-next-line no-unused-vars
        Object.entries(variants).forEach(([_key, value]) =>
          flat_list.push({ resource, value, source }),
        );
      }
    }

    const groups = Object.groupBy(flat_list, ({ resource }) => resource);
    return { resources, sources, data, groups };
  })();

  let filter_by_source_raw = "";
  let filter_by_source_value = "";

  $: filter_by_source_value = filter_by_source_raw.toLowerCase().split(" ");

  const resource_group_filter = ({ source }) =>
    filter_by_source_value.every((input) =>
      input.startsWith("!")
        ? !source.toLowerCase().includes(input.slice(1))
        : source.toLowerCase().includes(input),
    );
</script>

<Layout>
  {#await _interface_promise}
    Грузимся...
  {:then _interface}
    <input
      type="text"
      placeholder="Фильтровать по источнику"
      bind:value={filter_by_source_raw}
    />
    <small
      >— используйте «!» при поиске для исключения, например, !bag !thing, —
      исключает источники со словами «bag» и «thing»</small
    >
    <h2>Оборот ресурсов {filter_by_source_raw}</h2>
    <h5>Ресурс -> источник: количество</h5>
    {#each Object.entries(_interface.groups) as [resource, groupValue]}
      {#key filter_by_source_value}
        <p resource_paragpraph>{resource}</p>
        <ul>
          {#each sortByResolve(groupValue, ({ value }) => value).filter(resource_group_filter) as { value, source }}
            <li resource_group_element>
              <span resource_group_element_key>{source}:</span>
              <span resource_group_element_value>
                {NumberFormatLetterize(value)}
              </span>
            </li>{/each}
        </ul>
      {/key}
    {/each}
  {:catch error}
    {error}
  {/await}
  <footer style="margin-top: 3em">
    При изменении любого ресурса у пользователя, происходит фиксация данных,
    которые можно проанализировать.
  </footer>
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
