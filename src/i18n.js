import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages () {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    // console.log(`loadLocaleMessages. key: ${key}`)
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  
  if (window.customLocales) {
    console.log(`loadLocaleMessages. customLocales: ${Object.keys(window.customLocales).length}`);
    for (const locale in window.customLocales) {     
        console.log(`loadLocaleMessages. custom locale: ${locale}`)
        if (messages[locale]) {
            console.log(`loadLocaleMessages. custom locale: ${locale} already exists. merge (${Object.keys(window.customLocales[locale]).length} keys) with existing`)
            messages[locale] = Object.assign(messages[locale], window.customLocales[locale]);
        } else {
          messages[locale] = window.customLocales[locale]      
        }
    }
  }

  return messages
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: loadLocaleMessages()
})
