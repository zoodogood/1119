<script>
  import { fetchFromInnerApi, timestampToDate } from "#lib/safe-utils.js";
  import Layout from "#site-component/Layout";
  import svelteApp from "#site/core/svelte-app.js";

  const i18n = svelteApp.i18n.pages.openChest;
  const Resources = {
    imageURL: "https://i.ibb.co/GCxwmxw/open-chest-variant1.gif",
  };

  const State = {
    loggerList: [],
  };

  async function clickHandler(pointerEvent) {
    const headers = { Authorization: svelteApp.storage.getToken() };
    const json = await fetchFromInnerApi("user/chest-open", {
      headers,
      method: "POST",
    });
    if (!json) {
      return;
    }

    if (json.notAllowed) {
      State.loggerList = [i18n.chestOnCooldown, timestampToDate(json.value)];
      return;
    }

    State.loggerList = [
      `${i18n.bonuses}: ${json.openCount}`,
      `${i18n.treasures}: ${Object.keys(json.treasures).length}:`,
      ...Object.entries(json.treasures).map((entrie) => entrie.join(" ")),
    ];
  }
</script>

<Layout>
  <article>
    <main>
      <h1>{i18n.label}</h1>
      <p>
        {@html i18n.mainInfo}
      </p>
      {#if !svelteApp.user}
        <small>{i18n.logInAgain}</small>
      {/if}
      <button disabled={!svelteApp.user} on:click={clickHandler}
        >{i18n.open}</button
      >
    </main>
    <section class="logger">
      <img src={Resources.imageURL} alt="chest" />
      <ul class="logger-list">
        {#each State.loggerList as log, i}
          {#key log}
            <li style:--i={i}>{log}</li>
          {/key}
        {/each}
      </ul>
    </section>
  </article>
</Layout>

<style>
  button {
    margin-top: 10px;
    transition: transform 1s;
    width: 10em;
    height: 3em;
    font-size: 1.2em;
  }

  button:not([disabled]):hover {
    transform: rotateX(30deg);
  }

  article {
    display: flex;
    flex-wrap: wrap;
  }

  main {
    flex-grow: 3;
    width: 600px;
  }

  .logger {
    flex-grow: 1;
    flex-shrink: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .logger-list {
    min-width: 250px;
    text-align: center;
  }

  .logger li:first-of-type {
    font-size: 1em;
    text-transform: uppercase;
  }

  .logger li {
    animation-duration: 1s;
    animation-name: apparance;
    animation-delay: calc(1.2s * var(--i));
    animation-fill-mode: forwards;
    opacity: 0;
    font-size: 0.8em;
  }

  @keyframes apparance {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  img {
    max-width: min(100%, 50vw);
  }
</style>
