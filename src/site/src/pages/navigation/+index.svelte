<script>
  import svelteApp from "#site/core/svelte-app.js";
  import PagesRouter from "#site/lib/Router.js";

  import Layout from "#site-component/Layout";
  import Icon from "#site-component/iconic";
  import config from "#config";
  import { fetchFromInnerApi } from "#lib/safe-utils.js";
  import { Theme } from "#site-component/ThemeSwitcher";
  const CurrentThemeStore = Theme.current;

  const whenApiListIsReceived = (async () => {
    return fetchFromInnerApi("./utils/api_list");
  })();

  let node;
  const i18n = svelteApp.i18n.pages.navigation;

  const features = {
    handleClick(pointerEvent) {
      if (pointerEvent.target.nodeName !== "A") {
        return;
      }

      const node = pointerEvent.target;
      const url = node.getAttribute("href");
      const name = node.textContent;
      features.AddToHistory({ url, name });
    },
    AddToHistory({ url, name }) {
      localStorage.navigationPageHistory ||= "[]";
      const history = JSON.parse(localStorage.navigationPageHistory);
      const index = history.findIndex((item) => item.name === name);
      ~index && history.splice(index, 1);
      history.length > 10 && history.shift();
      history.push({ url, name });

      localStorage.navigationPageHistory = JSON.stringify(history);
    },
  };
</script>

{#if $CurrentThemeStore === Theme.enum.lightGreen}
  <style>
    body {
      background: url("https://i.ibb.co/ws2hjwT/summer.webp")
        var(--background-theme-accent);
      background-size: min(100vmax, 200vw);
      background-repeat: no-repeat;
    }
  </style>
{/if}

<Layout>
  <span>
    <h1>{i18n.label}</h1>
    <hr />
  </span>

  <main
    bind:this={node}
    on:click={features.handleClick}
    on:keydown={features.handleClick}
  >
    <details open class="table pages">
      <summary>{i18n.pages.label} <Icon code="" /></summary>
      <ul>
        {#each Object.values(PagesRouter.pages) as pageKey}
          {@const url = PagesRouter.relativeToPage(pageKey)}
          <li>
            <a href={url}>{url.replace(config.server.origin, "")}</a>
          </li>
        {/each}
      </ul>
    </details>

    <details open class="table api">
      <summary>{i18n.api.label} <Icon code="" /></summary>
      <details open>
        <summary><b>{i18n.api.simple}</b></summary>
        <p>
          <small>{i18n.api.simpleDescription}</small>
        </p>
        {#await whenApiListIsReceived}
          <p>{i18n.api.loading}</p>
        {:then data}
          <ul>
            {#each data.filter((route) => route.isSimple && route.methods.includes("get")) as route}
              {@const url = config.server.origin.concat(route.prefix)}
              <li>
                <a href={url}>{route.prefix}</a>
              </li>
            {/each}
          </ul>
        {:catch}
          <p>{i18n.api.serverNotAvailable}</p>
        {/await}
      </details>

      <details>
        <summary><b>{i18n.api.special}</b></summary>
        <p>
          <small>{i18n.api.specialDescription}</small>
        </p>
        {#await whenApiListIsReceived}
          <p>{i18n.api.loading}</p>
        {:then data}
          <ul>
            {#each data.filter((route) => route.methods.length && !route.isRegex) as route}
              {#each route.methods as method}
                <li>
                  <code>{method.toUpperCase()}</code>
                  <span>{route.prefix}</span>
                </li>
              {/each}
            {/each}
          </ul>
        {:catch}
          <p>{i18n.api.serverNotAvailable}</p>
        {/await}
      </details>

      <details>
        <summary><b>{i18n.api.regexp}</b></summary>
        <p>
          <small>{i18n.api.regexpDescription}</small>
        </p>
        <ul>
          {#await whenApiListIsReceived}
            <p>{i18n.api.loading}</p>
          {:then data}
            <ul>
              {#each data.filter((route) => route.isRegex) as route}
                <li>
                  <span>{route.prefix}</span>
                </li>
              {/each}
            </ul>
          {:catch}
            <p>{i18n.api.serverNotAvailable}</p>
          {/await}
        </ul>
      </details>
    </details>

    <details open class="table other">
      <summary>{i18n.other.label} <Icon code="" /></summary>
      <ul>
        <li><a href={config.guild.url}>{i18n.other.server}</a></li>
        <li><a href={config.enviroment.github}>{i18n.other.github}</a></li>
        <li><a href={svelteApp.getBot().invite}>{i18n.other.inviteBot}</a></li>
        <li>
          <a href="https://learn.javascript.ru/hello-world"
            >{i18n.other.learnJavascript}</a
          >
        </li>
      </ul>
    </details>

    <details
      open
      class="table history"
      style:display={localStorage.navigationPageHistory ? null : "none"}
    >
      <summary>{i18n.history.label} <Icon code="" /></summary>
      <ul>
        {#each JSON.parse(localStorage.navigationPageHistory ?? "[]").reverse() as item}
          <li>
            <a href={item.url}>{item.name}</a>
          </li>
        {/each}
      </ul>
    </details>
  </main>
</Layout>

<style>
  main {
    --min-table-width: 350px;
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 30px;
  }

  .table > summary {
    font-weight: 100;
    font-size: 1.35em;
    margin-bottom: 0.5em;

    display: flex;
    justify-content: space-between;
    cursor: pointer;
    transition: opacity 300ms;
  }

  .table > summary:hover {
    opacity: 0.5;
  }

  ul {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  li {
    list-style: none;
    opacity: 0.8;

    font-weight: 800;
    font-family: monospace;
    width: 100%;
    display: flex;
    align-items: center;
    padding-left: 1em;

    position: relative;
  }

  li::before {
    content: "~";
    display: inline-block;
    width: 0.3em;
    height: 0.3em;
    color: var(--main-color);
    position: absolute;
    top: 0;
    left: 0;
  }

  li:hover::before {
    content: "[";
    opacity: 0.5;
  }

  li:hover::after {
    content: "]";
    display: inline-block;
    width: 0.3em;
    height: 0.3em;
    color: var(--main-color);
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0.5;
  }

  li:nth-child(10n) {
    margin-bottom: 1em;
  }

  li a {
    color: #17a3d6;
    display: inline-block;
    width: 100%;
  }

  li a:hover {
    background-color: #88888811;
  }

  li span {
    color: var(--text-theme-accent);
  }

  .table {
    border-radius: 15px;
    background-color: #88888810;
    padding: 15px;
    width: max-content;
    flex-grow: 1;
    font-size: 0.7em;

    min-width: min(100%, var(--min-table-width));
    max-width: 100%;
  }

  .table:not([open]) {
    align-self: flex-start;
  }

  details[open] {
    padding-bottom: 30px;
  }

  .table p {
    max-width: var(--min-table-width);
  }

  .table small {
    opacity: 0.7;
  }
</style>
