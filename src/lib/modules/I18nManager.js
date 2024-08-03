import StorageManager from "#lib/modules/StorageManager.js";
import mol_global from "mol_tree2";
class StorageUtils {
  static async readLocales() {
    const { $mol_tree2_from_string, $mol_tree2_to_json } = mol_global;
    const tree =
      (await StorageManager.read("i18n.tree")) ||
      $mol_tree2_from_string(`*\n\tru *\n`);
    const value = $mol_tree2_to_json.call(mol_global, tree.kids[0]);
    return value;
  }
}
class I18nManager {
  static DEFAULT_LOCALE = "ru";

  static resolveLocale(locale) {
    locale ||= this.DEFAULT_LOCALE;
    return (
      {
        ru: "ru",
        "ru-ru": "ru",
        uk: "ua",
        ua: "ua",
        en: "en",
        uk_ua: "ua",
        "ua-ua": "ua",
        en_us: "en",
        en_gb: "en",
        "en-en": "en",
      }[locale.toLowerCase()] ?? this.DEFAULT_LOCALE
    );
  }

  f(...params) {
    return this.format(...params);
  }

  format(key, { locale, values } = {}) {
    locale = I18nManager.resolveLocale(locale);
    const string =
      this.getRaw(key, locale) || this.getRaw(key, I18nManager.DEFAULT_LOCALE);

    if (!string) {
      throw new Error(`Cannot find ${key}`);
    }

    return string;
  }

  getRaw(key, locale) {
    return this.data[locale]?.[key];
  }
  async load() {
    this.data = await StorageUtils.readLocales();
  }
}

export { I18nManager };
export default I18nManager;
