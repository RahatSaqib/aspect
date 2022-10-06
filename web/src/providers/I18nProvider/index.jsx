import React, { createContext } from 'react'
import format from 'date-fns/format'
import formatDistance from 'date-fns/formatDistance'
import deLocale from 'date-fns/locale/de'
import usLocale from 'date-fns/locale/en-US'
import esLocale from 'date-fns/locale/es'
import frLocale from 'date-fns/locale/fr'
import ptLocale from 'date-fns/locale/pt'
import ruLocale from 'date-fns/locale/ru'
import ukLocale from 'date-fns/locale/uk'
import viLocale from 'date-fns/locale/vi'
import { DateTime } from 'luxon'
import { createIntl, useIntl } from 'react-intl' // eslint-disable-line no-restricted-imports
import ErrorBoundary from '../../components/ErrorBoundary'
import translation from '../../utils/i18n/translation'
import { getCurrentCulture } from '../../utils/LocalStorage'
import tgLocale from './date-fns-locales/tg-TJ'

const I18nContext = createContext()

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
    new Date().toLocaleString('en', {
      timeZone: timezone,
    })
    return timezone
  } catch (e) {
    console.warn(`${timezone}: Invalid timezone, falling back to America/Los_Angeles`)
    return 'America/Los_Angeles'
  }
}

function i18nWrapper(messages, passedCulture = false, passedTimezone = false) {
  const localStorageCulture = getCurrentCulture()

  const userLocale = passedCulture || localStorageCulture || 'en'

  const intl = createIntl({
    locale: userLocale === 'tg-TJ' ? 'uz-Cyrl' : userLocale,
    messages: messages || translation[userLocale],
    onError: () => {}, // to not show console.error with MISSING_TRANSLATION
  })

  const timezone = passedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const { formatDate, formats, formatMessage, locale, ...rest } = intl
  const dateFNSLocale = dateFNSLocales[userLocale]
  const validTimeZone = timeZoneFallBack(timezone)
  return {
    culture: locale,
    dateFNSLocale,
    format: (dateIn, formatIn) => format(dateIn, formatIn, { locale: dateFNSLocale }),
    formats,
    formatDate: (dateIn, options = {}) => formatDate(dateIn, options),
    formatWithOffset: dateIn => DateTime.fromJSDate(dateIn).setZone(validTimeZone).toISO(),
    formatDistance: (firstDateIn, secondDateIn, showSuffix = false) =>
      formatDistance(firstDateIn, secondDateIn, {
        locale: dateFNSLocale,
        addSuffix: showSuffix,
      }),
    formatTimezone: dateIn =>
      dateIn.toLocaleString(locale, {
        timeZone: validTimeZone,
      }),
    formatMessage: (stringIn, values = {}, fallback = `!! I18N ID not set !!`) =>
      !stringIn ? fallback : formatMessage(stringIn, values),
    timezone: validTimeZone,
    ...rest,
  }
}

const I18nProvider = ({ children }) => {
  const { messages } = useIntl()
  const value = i18nWrapper(messages)
  return (
    <I18nContext.Provider value={value}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </I18nContext.Provider>
  )
}

export { I18nProvider, I18nContext, i18nWrapper }
