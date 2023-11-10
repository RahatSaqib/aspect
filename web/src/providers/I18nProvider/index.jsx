import React from 'react'
import { utcToZonedTime, format } from 'date-fns-tz'
import formatDistance from 'date-fns/formatDistance'
import deLocale from 'date-fns/locale/de'
import usLocale from 'date-fns/locale/en-US'
import esLocale from 'date-fns/locale/es'
import frLocale from 'date-fns/locale/fr'
import ptLocale from 'date-fns/locale/pt'
import ruLocale from 'date-fns/locale/ru'
import ukLocale from 'date-fns/locale/uk'
import tgLocale from 'date-fns/locale/uz-Cyrl'
import viLocale from 'date-fns/locale/vi'
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl' // eslint-disable-line no-restricted-imports
import translation from '../../utils/i18n/translation.json'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

export const dateFNSLocales = {
  de: deLocale,
  'de-DE': deLocale,
  en: usLocale,
  'en-US': usLocale,
  fr: frLocale,
  'fr-FR': frLocale,
  pt: ptLocale,
  'pt-PT': ptLocale,
  ru: ruLocale,
  'ru-RU': ruLocale,
  uk: ukLocale,
  'uk-UA': ukLocale,
  es: esLocale,
  'es-ES': esLocale,
  tg: tgLocale,
  'tg-TJ': tgLocale,
  vi: viLocale,
}

function timeZoneFallBack(timezone) {
  try {
    new Date().toLocaleString('en', { timeZone: timezone })
    return timezone
  } catch (e) {
    console.warn(`${timezone}: Invalid timezone, falling back to America/Los_Angeles`)
    return 'America/Los_Angeles'
  }
}

const I18nProvider = ({ children }) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const validTimeZone = timeZoneFallBack(timezone)

  const userLocale = localStorage.getItem('asCulture') || 'en'
  const dateFNSLocale = dateFNSLocales[userLocale]

  const finalLocale = userLocale === 'tg-TJ' ? 'uz-Cyrl' : userLocale
  const finalMessages = translation[userLocale]

  const intl = createIntl({ locale: finalLocale, messages: finalMessages, onError: () => {} }, cache)

  // if we use a react provider we need a intlProvider wrapping it. Instead of 2 providers, the correct way is to use a RawIntProvider
  // https://formatjs.io/docs/react-intl/components/#rawintlprovider
  return (
    <RawIntlProvider
      value={{
        ...intl,
        format: (dateIn, formatIn) => format(dateIn, formatIn, { locale: dateFNSLocale }),
        formatDate: (dateIn, options = {}) => intl.formatDate(dateIn, options),
        formatWithOffset: dateIn =>
          format(utcToZonedTime(dateIn, validTimeZone), "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: validTimeZone }),
        formatDistance: (firstDateIn, secondDateIn, showSuffix = false) =>
          formatDistance(firstDateIn, secondDateIn, { locale: dateFNSLocale, addSuffix: showSuffix }),
        formatTimezone: dateIn => dateIn.toLocaleString(finalLocale, { timeZone: validTimeZone }),
        formatMessage: (stringIn, values = {}, fallback = `!! I18N ID not set !!`) =>
          !stringIn ? fallback : intl.formatMessage(stringIn, values),
        timezone: validTimeZone,
      }}
    >
      {children}
    </RawIntlProvider>
  )
}

export { I18nProvider }
