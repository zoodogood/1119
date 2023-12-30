class I18nManager {
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
    // to-do: developer crunch
    return `${key} | ${locale}, not implemented`;
  }

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
}

export default I18nManager;
