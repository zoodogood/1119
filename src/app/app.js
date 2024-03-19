import PagesRouter from "#site/lib/Router.js";
import PagesURLs from "#static/build/svelte-pages/enum[builded].mjs";

class App {
  /** @type import("discord.js").Client | null */
  client = null;

  server = null;

  cli = null;

  /** @type {string} */
  version = null;

  svelte = null;

  /**@type {import("#lib/modules/I18nManager.js").I18nManager} */
  i18n = null;

  async launch() {
    PagesRouter.resolvePages(PagesURLs);
  }
}

const app = new App();

export default app;
export { app };
