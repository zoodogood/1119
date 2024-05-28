<script>
  import Layout from "#site-component/Layout";
  import Icon from "#site-component/iconic";
  import svelteApp from "#site/core/svelte-app.js";

  import {
    dayjs,
    ending,
    fetchFromInnerApi,
    resolveGithubPath,
    yaml,
  } from "#lib/safe-utils.js";
  import PagesRouter from "#site/lib/Router.js";

  import Path from "path";

  const i18n = svelteApp.i18n.pages.errorsItem;

  const Component = {
    errors: [],
  };

  const Search = {
    filter({ key, meta }) {
      if (!Search.value) {
        return true;
      }
      const blacklist = [];
      const whitelist = [];

      Search.value
        .split(" ")
        .forEach((word) =>
          word.startsWith("!")
            ? blacklist.push(word.slice(1))
            : whitelist.push(word),
        );

      const isIncludes = (list) =>
        list.every(
          (word) =>
            key.includes(word) ||
            meta.uniqueTags.some((tag) => tag.includes(word)),
        );

      return (
        isIncludes(whitelist) && (!blacklist.length || !isIncludes(blacklist))
      );
    },
    tagClickHandler(clickEvent) {
      if (clickEvent.target.tagName !== "LI") {
        return;
      }

      const value = clickEvent.target.textContent;
      Search.value = Search.value.includes(value)
        ? Search.value.replace(value, `!${value}`)
        : `${Search.value} ${value}`;
    },
    value: "",
  };

  (async () => {
    const URLSubpath = svelteApp.url.subpath;
    const fileKey =
      URLSubpath.at(-1).startsWith(":") && URLSubpath.at(-1).slice(1);

    const DEFAULT = "current";
    const path = fileKey ? `files/${fileKey}` : DEFAULT;

    const { groups } = await fetchFromInnerApi(`errors/${path}`);
    for (const { errors: array } of groups) {
      for (const item of array) {
        item.context = (item.context && JSON.parse(item.context)) || {};
        item.stack = item.stackData
          ? decodeURI(item.stackData.stack).replaceAll("\\", "/")
          : null;
        item.strokeOfError = item.stackData?.strokeOfError;
        item.fileOfError = item.stackData?.fileOfError;

        try {
          item.stackData &&
            (item.githubURL = resolveGithubPath(
              Path.relative(
                svelteApp.enviroment.cwd,
                item.stackData.fileOfError ?? ".",
              ),
              item.stackData.strokeOfError,
            ));
        } catch (error) {
          console.error(error);
        }
      }
    }

    Component.errors = groups;
    console.info(Component.errors);
  })();
</script>

<Layout>
  <main>
    <h1>{i18n.label}</h1>

    <p>
      {i18n.uniqueCount}
      <span>{Component.errors.length}</span>
    </p>
    <a
      class="collections-link"
      href={PagesRouter.relativeToPage(
        PagesRouter.getPageBy("errors/list").key,
      )}><Icon code="" /> {i18n.backToCollections}</a
    >
    {#if Component.errors.length}
      <input
        type="text"
        placeholder=" {i18n.filter}"
        bind:value={Search.value}
        title={i18n.filterTip}
      />
    {/if}

    <ul class="errors">
      {#each Component.errors.filter(Search.filter) as element}
        {@const { key, errors: array, meta } = element}
        <li class="error-file" id={key}>
          <h2>{key}</h2>
          <section class="tags">
            <span>{i18n.tags}</span>

            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <ul on:click={Search.tagClickHandler} on:keydown={() => {}}>
              {#each meta.uniqueTags as tag}
                <li>{tag}</li>
              {/each}
            </ul>
            ;
          </section>
          <p>
            <span>{i18n.called}</span>
            {ending(array.length, ...i18n.times__ending)};
          </p>

          <details class="error-details">
            <summary>{i18n.details}</summary>
            {#each array as arrayErrorElement, i}
              <details class="arrayErrorElement">
                <summary
                  >{i18n.element} #{i + 1} ({dayjs(
                    arrayErrorElement.createdAt,
                  ).format("HH:mm")})</summary
                >
                <h3>{i18n.context}</h3>
                <code class="context">
                  {yaml.stringify(arrayErrorElement.context)}
                </code>

                <h3>{i18n.stack}</h3>
                <code class="stack">
                  {arrayErrorElement.stack}
                </code>
                {arrayErrorElement.githubURL || ""}
              </details>
            {/each}
          </details>
        </li>
      {/each}
    </ul>
  </main>
</Layout>

<style>
  h1 {
    color: #3b7c4c;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 100;
  }

  input {
    font-family: "Icon", sans-serif;
    font-weight: 100;
    margin-top: 1em;
  }

  .collections-link {
    font-size: 0.5em;
    display: block;
  }

  .errors {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    gap: 15px;
  }

  .error-file {
    border-radius: 15px;
    background-color: #88888811;
    width: calc(800px + 10vw);
    max-width: 100%;
    min-height: calc(400px + 5vw);
    flex-grow: 1;

    padding-inline: 1.5em;
    padding-bottom: 2em;
    font-size: 0.8em;

    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .error-details {
    margin-top: auto;
    padding-top: 3em;
  }

  .tags ul {
    display: inline-flex;
    gap: 1em;
  }

  .tags li {
    display: inline-block;
    font-family: monospace;
    background-color: #88888844;
    cursor: pointer;
  }

  .tags li:not(:last-child)::after {
    content: ", ";
    position: absolute;
  }

  details > summary {
    list-style-type: "";
    cursor: pointer;
  }

  details > summary::before {
    content: "";
    font-family: "Icon";
    display: inline-block;
    transition: transform 300ms;
    transform: rotate(90deg);

    opacity: 0.5;
    margin: 1vw;
  }

  details[open] > summary::before {
    transform: rotate(180deg);
  }

  .stack,
  .context {
    font-size: 0.65em;
    padding: 1em;
    width: 100%;
    white-space: pre;
    border-radius: 5px;
    overflow: auto;
  }

  .arrayErrorElement {
    font-size: 0.8em;
  }
</style>
