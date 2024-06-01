<script>
  import config from "#config";
  import { dayjs } from "#lib/safe-utils.js";
  import Image from "#site-component/Image";
  import svelteApp from "#site/core/svelte-app.js";
  import PagesRouter from "#site/lib/Router.js";

  const bot = svelteApp.getBot();
  const i18n = svelteApp.i18n.components.Layout.Footer;
</script>

<footer class="container">
  <main class="footer-main">
    <section class="article">
      <aside class="article-aside article-title">
        <h2 class="article-aside-header">{i18n.imagine}</h2>
        <p class="article-aside-paragraph">Expented 2022</p>
      </aside>
      <section class="article-information_section group">
        <aside class="article-aside">
          <h3 class="article-aside-header">{i18n.info.label}</h3>
          <ul class="article-aside-list">
            <li>
              <a
                href={PagesRouter.relativeToPage(
                  PagesRouter.getPageBy("info/policy").key,
                )}>{i18n.info.policy}</a
              >
            </li>
            <li>
              <a
                href={PagesRouter.relativeToPage(
                  PagesRouter.getPageBy("info/friendship").key,
                )}>{i18n.info.thanks}</a
              >
            </li>
            <li>
              <a
                href={PagesRouter.relativeToPage(
                  PagesRouter.getPageBy("info/1119").key,
                )}>1119</a
              >
            </li>
            <li></li>
          </ul>
        </aside>
        <aside class="article-aside">
          <h3 class="article-aside-header">{i18n.nav.label}</h3>
          <ul class="article-aside-list">
            <li><a href={bot.invite}>{i18n.nav.invite}</a></li>
            <li>
              <a href={config.guild.url} target="_blank" rel="noreferrer"
                >{i18n.nav.discord}</a
              >
            </li>
            <li><a href={config.enviroment.github}>{i18n.nav.github}</a></li>
            <li>
              <a href="{config.enviroment.github}/issues/new">{i18n.nav.help}</a
              >
            </li>
          </ul>
        </aside>
      </section>
    </section>

    <section class="bottom-container">
      <hr class="bottom-horizontal_line" />
      <header class="build-info">
        <span>
          При поддержке Expented; Версия: V{svelteApp.enviroment.version};
          Сборка от {dayjs(svelteApp.enviroment.buildedTimestamp).format(
            "DD.MM.YYYY HH:mm",
          )}
        </span>
      </header>

      <main class="bottom-main">
        <aside class="bottom-main-title">
          <span class="bot-icon">
            <Image src={bot.displayAvatarURL} alt="bot avatar" />
          </span>
          <span>{bot.username}</span>
        </aside>

        <aside class="invite">
          <a href={bot.invite}>
            <button>{i18n.invite}</button>
          </a>
        </aside>
      </main>
    </section>
  </main>
</footer>

<style>
  .container {
    margin-top: 50vh;
    background: var(--background-theme-accent);
    position: relative;
    filter: var(--page-filter);
    border-top: 2px solid var(--main-color);

    overflow: hidden;
  }

  .footer-main {
    display: flex;
    width: 100%;
    background-color: #deeefc15;

    flex-direction: column;
  }

  .article {
    flex-grow: 3;

    gap: 80px;

    line-height: 1.2;
    font-weight: 300;
  }

  .article-aside-header {
    color: var(--main-color);
    margin-bottom: 30px;
    font-weight: 400;
  }

  .article-information_section {
    display: flex;
    gap: 80px;
    flex-wrap: wrap;
  }

  .article-aside-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.8em;
  }

  .article,
  .bottom-main,
  .build-info {
    width: 100%;
    padding: calc(20px + 1vw);
    padding-right: calc(30px + 1vw);

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .bottom-container {
    display: flex;
    flex-direction: column;

    width: 100%;
    flex-grow: 1;
  }

  .bottom-main {
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 40px;

    font-weight: 100;
  }

  .bottom-horizontal_line {
    background-color: var(--text-theme-accent);
    width: 100%;
    height: 2px;
  }

  .article-title {
    margin-right: 400px;
  }

  .article-title > .article-aside-header {
    font-size: 2em;
  }

  .bottom-main-title {
    display: flex;
    align-items: center;
    gap: 10px;

    font-weight: 500;
  }

  .build-info {
    font-size: 0.4em;
    font-family: monospace;
    padding-block: 0;
    opacity: 0.2;

    transition: opacity 1s;
    max-height: 0;
    overflow: visible;
  }

  .build-info > span {
    padding-top: 5px;
    cursor: default;
  }

  .build-info:hover {
    opacity: 1;
  }

  .bot-icon {
    width: 2em;
    aspect-ratio: 1 / 1;
    border-radius: 20px;
    display: flex;
  }

  .bot-icon img {
    border-radius: 0.5em;
  }

  .invite > a {
    text-decoration-color: var(--white);
  }
</style>
