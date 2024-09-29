import {
  ReplaceTemplate,
  fetchFromInnerApi,
  omit,
  parseDocumentLocate,
} from "#lib/safe-utils.js";
import HashController from "#site/lib/HashController.js";
import { createDialog } from "#site/lib/createDialog.js";

import enviroment from "#site/enviroment/mod.js";
import { whenDocumentReadyStateIsComplete } from "#site/lib/util.js";

import config from "#config";
import { DAY } from "#constants/globals/time.js";
import PagesRouter from "#site/lib/Router.js";
import PagesURLs from "#static/build/svelte-pages/enum[builded].mjs";

class StorageManager {
  getSelectedLocale() {
    return localStorage.getItem("selected_locale") ?? null;
  }

  getToken() {
    return localStorage.getItem("access_token");
  }

  getUserData() {
    return JSON.parse(localStorage.getItem("user") ?? null);
  }

  setLocale(locale) {
    if (locale === null) {
      localStorage.removeItem("selected_locale");
      return;
    }

    localStorage.setItem("selected_locale", locale);
  }

  setToken(token) {
    if (token === null) {
      localStorage.removeItem("access_token");
      return;
    }

    return localStorage.setItem("access_token", token);
  }

  setUserData(user) {
    if (user === null) {
      localStorage.removeItem("user");
      return;
    }

    const ignoreKeysList = ["guilds"];
    user = omit(user, (key) => !ignoreKeysList.includes(key));
    return localStorage.setItem("user", JSON.stringify(user));
  }

  yetTokenHeat() {
    if (localStorage.tokenHeat > Date.now()) {
      return true;
    }

    const HEAT_DELAY = DAY * 14;
    localStorage.tokenHeat = Date.now() + HEAT_DELAY;
    return false;
  }
}

class SvelteApp {
  Date = new Date();
  document = document;
  enviroment = enviroment;
  Hash = this.#createHashController();
  HashData;
  i18n = null;
  PagesURLs = PagesURLs;
  storage = new StorageManager();
  url = parseDocumentLocate(this.document.location);
  user = this.storage.getUserData();

  constructor() {
    this.lang = this.url.base.lang ?? this.storage.getSelectedLocale() ?? "ru";
    this.i18n = this.enviroment.i18n[this.lang];

    this.#checkOrigin();
    this.#checkExternalUserDataByToken();
    this.#checkURLLocaleProtocol();
    console.info(this);
  }

  async #checkExternalUserDataByToken() {
    await whenDocumentReadyStateIsComplete(this.document);

    const token = this.storage.getToken();
    if (!token) {
      return;
    }

    const yet = this.storage.yetTokenHeat();
    if (yet) {
      return;
    }

    const headers = { Authorization: token };
    const user = await fetchFromInnerApi("oauth2/user", { headers }).catch(
      () => {},
    );

    if (!user || typeof user === "string") {
      const _key = PagesRouter.getPageBy("oauth").key;
      const link = PagesRouter.relativeToPage(_key);
      createDialog(svelteApp, {
        title: this.i18n.general.app.externalTokenDialog.title,
        description: ReplaceTemplate(
          this.i18n.general.app.externalTokenDialog.description,
          { link, _key },
        ),
        isHTMLAccepted: true,
      });
      return;
    }

    this.storage.setUserData(user);
  }

  #checkOrigin() {
    if (config.server.origin !== this.document.location.origin) {
      console.error(
        `You need set in config server.origin equal to ${this.document.location.origin}\nCurrent: ${config.server.origin}`,
      );
    }
  }

  #checkURLLocaleProtocol() {
    const locale = this.url.base.lang;
    if (!locale) {
      return;
    }

    this.storage.setLocale(locale);
  }

  #createHashController() {
    const controller = new HashController().subscribe();
    controller.store.subscribe(this.#onHashUpdate.bind(this));
    return controller;
  }

  #onHashUpdate(hash) {
    const data = (this.HashData ||= { hash: {} });
    data.currentHash = hash;
    Object.assign(data.hash, hash);
  }

  getBot() {
    const bot = this.enviroment.bot ?? {
      id: null,
      username: "Призрак",
      discriminator: "1119",
      displayAvatarURL: `${config.server.origin}/static/favicon.ico`,
      invite: null,
    };

    return bot;
  }

  get href() {
    return this.document.location.href;
  }
}

const svelteApp = new SvelteApp();

export default svelteApp;
export { svelteApp };
