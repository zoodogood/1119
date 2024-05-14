<script>
  import Layout from "#site-component/Layout";
  import PagesRouter from "#site/lib/Router.js";
  import {
    dayjs,
    fetchFromInnerApi,
    ReplaceTemplate,
    timestampToDate,
  } from "#lib/safe-utils.js";
  import svelteApp from "#site/core/svelte-app.js";
  import Path from "path";

  const i18n = svelteApp.i18n.pages.articlesIndex;
  const AVERAGE_PER_WORD = 60_000 / 200;

  const articlesPromise = (async () => {
    const { list, metadata: _metadata } =
      await fetchFromInnerApi("site/articles");
    const parse = (id) => {
      const metadata = _metadata[id] ?? {};
      const name = Path.basename(id, ".md");
      return { id, name, metadata };
    };
    const articles = list.map(parse);
    return articles;
  })();

  articlesPromise.then((data) => (articlesPromise.filesCount = data.length));

  const Search = {
    value: "",
    filter(article) {
      const isIncludes = (content) => content.includes(Search.value);
      const metadata = article.metadata;
      return (
        isIncludes(article.name) ||
        isIncludes(metadata.author?.username) ||
        isIncludes(metadata.tags)
      );
    },
  };
</script>

<Layout>
  <group>
    <h1>{i18n.label}</h1>
    <p>{i18n.description}</p>
  </group>

  <section class="article-create">
    <h3>{i18n.createInfo.label}</h3>
    <p>
      {@html ReplaceTemplate(i18n.createInfo.content, {
        href: PagesRouter.relativeToPage(
          PagesRouter.getPageBy("articles/create").key,
        ),
      })}
    </p>
  </section>

  <section class="articles-container">
    <h3>{i18n.articlesList.label}</h3>
    <p>{i18n.articlesList.filesCount} {articlesPromise.filesCount ?? 0}</p>
    {#await articlesPromise}
      <p>{i18n.articlesList.loading}</p>
    {:then data}
      {@const list = data.filter(Search.filter)}
      <input
        type="text"
        placeholder=" {i18n.filter}"
        bind:value={Search.value}
      />
      <ul class="articles-list">
        {#if list.length}
          {#each list as article}
            {@const { id, metadata, name } = article}
            {@const href = `${PagesRouter.relativeToPage(PagesRouter.getPageBy("articles/item").key)}?id=${id}`}
            <li class="article">
              <a {href}>
                <p>{name}</p>
                <ul class="article-metadata">
                  <li data-value={metadata.author} title={metadata.author?.id}>
                    {i18n.articleMetadata.author}
                    {metadata.author?.username}
                  </li>
                  <li data-value={metadata.wordsCount}>
                    {i18n.articleMetadata.readTime} ~{timestampToDate(
                      metadata.wordsCount * AVERAGE_PER_WORD,
                    )}
                  </li>
                  <li data-value={metadata.timestamp}>
                    {i18n.articleMetadata.lastEdited}
                    {metadata.timestamp
                      ? dayjs(metadata.timestamp).format("DD.MM, HH:mm")
                      : null}
                  </li>
                  <li data-value={metadata.tags}>
                    {i18n.articleMetadata.tags}
                    {metadata.tags?.join(", ")}
                  </li>
                </ul>
              </a>
            </li>
          {/each}
        {:else}
          <p>{i18n.articlesList.hereEmpty}</p>
        {/if}
      </ul>
    {:catch}
      <p>{i18n.articlesList.loadingFailed}</p>
    {/await}
  </section>
</Layout>

<style>
  a {
    color: var(--main-color);
  }

  .articles-list {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    margin-top: 1em;
  }

  .articles-list .article {
    display: flex;
    flex-direction: column;
    background-color: #88888822;
    min-width: 300px;
    height: 200px;
    border-radius: 15px;
    animation: article-apparance 1s;
    color: var(--text-theme-accent);

    flex-grow: 1;
  }

  .articles-list a {
    text-decoration: none;
    color: inherit;
    flex-grow: 1;
    padding: 20px;
    padding-right: 1.5em;
  }

  .article:hover p {
    text-decoration: underline;
  }

  .article .article-metadata {
    display: flex;
    flex-direction: column;
    list-style: none;
    font-size: 0.5em;
    opacity: 0.7;
  }

  .article .article-metadata li:not([data-value]) {
    display: none;
  }

  @keyframes article-apparance {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  input {
    font-family: "Icon", sans-serif;
    font-weight: 100;
    margin-top: 1em;
  }
</style>
