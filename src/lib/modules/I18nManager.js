import { mol_tree2_json_from_string } from "#lib/$mol.js";
import StorageManager from "#lib/modules/StorageManager.js";
class StorageUtils {
  static async readLocales() {
    const value = mol_tree2_json_from_string(
      (await StorageManager.read("i18n.tree")) || `*\n\tru *\n`,
    );

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

  format(key, locale, { values } = {}) {
    locale = I18nManager.resolveLocale(locale);
    let string =
      this.getRaw(key, locale) || this.getRaw(key, I18nManager.DEFAULT_LOCALE);

    for (const [replacer, value] of Object.entries(values)) {
      string = string.replace(`$${replacer}`, value);
    }

    if (!string) {
      throw new Error(`I18n not found: cannot find "${key}"`);
    }

    return string;
  }

  getRaw(key, locale) {
    return this.data[key]?.[locale];
  }
  async load() {
    this.data = await StorageUtils.readLocales();
  }
}

export { I18nManager };
export default I18nManager;
