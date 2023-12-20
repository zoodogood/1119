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
}

export default I18nManager;
