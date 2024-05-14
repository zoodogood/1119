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

  let filter_by_source_value = "";
</script>

<Layout>
  {#await _interface_promise}
    Грузимся
  {:then _interface}
    <input
      type="text"
      placeholder="Фильтровать по источнику"
      bind:value={filter_by_source_value}
    />
    <h2>Оборот ресурсов {filter_by_source_value}</h2>
    <h5>Ресурс -> источник: количество</h5>
    {#each Object.entries(_interface.groups) as [resource, groupValue]}
      <p resource_paragpraph>{resource}</p>
      <ul>
        {#each sortByResolve(groupValue, ({ value }) => value).filter( ({ source }) => source.includes(filter_by_source_value), ) as { value, source }}
          <li>{source}: {NumberFormatLetterize(value)}</li>{/each}
      </ul>
    {/each}
  {:catch error}
    {error}
  {/await}
</Layout>

<style>
  [resource_paragpraph] {
    text-transform: capitalize;
    position: sticky;
    top: 0;
  }
</style>
