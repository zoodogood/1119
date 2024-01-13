<script>
  import config from "#config";
  import ThemeSwitcher from "#site-component/ThemeSwitcher";
  import Icon from "#site-component/iconic";
  import svelteApp from "#site/core/svelte-app.js";
  import PagesRouter from "#site/lib/Router.js";

  const i18n = svelteApp.i18n.components.Layout.Header;

  const Header = {
    node: null,
    isHide: false,
  };

  let scrollPosition = window.scrollY;
  function onScroll() {
    window.scrollY === 0 && (Header.isHide = false);

    scrollPosition > window.scrollY && (Header.isHide = false);

    scrollPosition < window.scrollY && (Header.isHide = true);

    scrollPosition = window.scrollY;
  }
</script>

<header
  class="page-header"
  bind:this={Header.node}
  class:header--hide={Header.isHide}
>
  <main class="container">
    <section class="label">
      <a
        href={PagesRouter.relativeToPage(PagesRouter.getPageBy("public").key)}
        class="link"
      >
        <b class="page_header-title-container-label"
          >{i18n.ghost.toUpperCase()}</b
        >
      </a>
    </section>

    <section class="navigation">
      <span class="theme-switcher-container">
        <ThemeSwitcher />
      </span>

      <nav>
        <a
          href={PagesRouter.relativeToPage(PagesRouter.getPageBy("public").key)}
          class="navigation-element link">{i18n.nav.home}</a
        >
        <a
          href={PagesRouter.relativeToPage(
            PagesRouter.getPageBy("navigation").key,
          )}
          class="navigation-element link">{i18n.nav.navigation}</a
        >
        <a
          href={config.guild.url}
          class="navigation-element link"
          target="_blank"
          rel="noreferrer">{i18n.nav.discord}</a
        >
      </nav>
    </section>

    {#if !svelteApp.user}
      <section class="authentication">
        <button
          class="oauth"
          on:click={() =>
            PagesRouter.redirect(
              `../oauth2/auth?redirect=${svelteApp.url.subpath.join("/")}`,
            )}
        >
          {i18n.authorization}
        </button>
      </section>
    {:else}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <section
        class="user"
        on:click={() =>
          PagesRouter.redirect(PagesRouter.getPageBy("user/panel").key)}
        on:keydown={({ target }) => target.click()}
      >
        <span class="user-avatar-container">
          <img src={svelteApp.user.avatarURL} alt="avatar" />
        </span>
        <hr />
      </section>
    {/if}
  </main>
</header>

<svelte:window on:scroll={onScroll} />

<style>
  header {
    width: 100%;
    position: sticky;
    top: 0;

    font-size: 0.8em;
    transition: top 200ms;
    backdrop-filter: blur(10px);
    z-index: 10000;

    user-select: none;
    overflow: hidden;
  }

  .header--hide {
    top: -15vh;
  }

  .container::after {
    content: "";
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    z-index: -1;

    background-color: var(--background-theme-accent);
    opacity: 0.2;
  }

  .container {
    display: flex;
    position: relative;

    padding-top: 20px;
    padding-bottom: 15px;

    padding-inline: calc(2.5vw + 10px);

    align-items: center;
    justify-content: space-around;

    height: 15vh;
    top: -5px;
    gap: 2em;
  }

  .label {
    flex-grow: 1;
  }

  .label::after {
    content: "Alpha";
    padding: 5px;
    border-radius: 3px;
    font-size: 0.5em;
    background-color: var(--main-color);
    color: var(--white);
    margin-inline: 5px;
  }

  .label:hover {
    text-decoration: none;
  }

  .authentication {
    display: flex;
    justify-content: flex-end;
  }

  .user {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 0.7em;
    gap: 0.4em;
    flex-direction: column;

    filter: grayscale(0.3);
  }

  .user:hover {
    filter: grayscale(0);
  }

  .user-avatar-container {
    display: flex;
    width: 3em;
    aspect-ratio: 1 / 1;
    transition: transform 1s;
  }

  .user:hover .user-avatar-container {
    transform: translateY(-10%);
  }

  .user-avatar-container img {
    width: 100%;
    border-radius: 1.5em;
  }

  .user hr {
    transition: width 200ms;
  }

  .user:hover hr {
    width: 50%;
  }

  .navigation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.2em;
  }

  .navigation .theme-switcher-container {
    overflow: visible;
  }

  .navigation :global(.switch-theme) {
    width: 2.25em;
    margin: 0;
    margin-left: 3px;
    vertical-align: middle;
  }

  .label,
  .navigation,
  .authentication {
    position: relative;
  }

  .navigation {
    color: var(--text-theme-accent);
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .navigation-element {
    transition: all 250ms;
  }

  .navigation-element:hover {
    color: var(--main-color);
    filter: brightness(1.2);
  }

  .navigation nav {
    display: flex;
    gap: 10px;
  }

  .link {
    position: relative;
  }

  .link:hover {
    text-decoration: none;
  }

  .link::before {
    content: "";
    display: block;
    position: absolute;

    height: 1px;
    background-color: currentColor;
    bottom: -0.15em;

    width: 0%;
    opacity: 0.5;
    transition:
      opacity 0.5s ease,
      width 0.5s ease;
    right: 0;
  }

  .link:hover::before {
    left: 0;
    width: 100%;
    opacity: 1;
  }

  @media (max-width: 980px) {
    .container {
      padding-top: 0;
      padding-bottom: 25px;
    }

    .navigation {
      position: absolute;
      bottom: 0.75em;
      flex-direction: row-reverse;
      gap: 0;
    }

    .navigation nav {
      gap: 20px;
      font-size: 0.8em;
    }

    .navigation-element {
      text-decoration: underline;
    }

    .navigation .theme-switcher-container {
      max-width: 0px;
      margin-bottom: 0.5em;
    }
  }
</style>
