import PagesRouter from "#site/lib/Router.js";
import PagesURLs from "#static/build/svelte-pages/enum[builded].mjs";

class App {
  cli = null;

  /** @type import("discord.js").Client | null */
  client = null;

  /**@type {import("#lib/modules/I18nManager.js").I18nManager} */
  i18n = null;

  server = null;

  svelte = null;

  /** @type {string} */
  version = null;

  async launch() {
    PagesRouter.resolvePages(PagesURLs);
  }
}

const app = new App();

export default app;
export { app };
