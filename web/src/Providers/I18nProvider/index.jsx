import React, { createContext } from 'react'
import { useIntl } from 'react-intl'
import { DateTime } from 'luxon'
import format from 'date-fns/format'
import formatDistance from 'date-fns/formatDistance'
import deLocale from 'date-fns/locale/de'
import usLocale from 'date-fns/locale/en-US'
import frLocale from 'date-fns/locale/fr'
import ruLocale from 'date-fns/locale/ru'
import ukLocale from 'date-fns/locale/uk'

import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'

const I18nContext = createContext()

export const dateFNSLocales = {
  de: deLocale,
  'de-DE': deLocale,
  en: usLocale,
  'en-US': usLocale,
  fr: frLocale,
  'fr-FR': frLocale,
  ru: ruLocale,
  'ru-RU': ruLocale,
  uk: ukLocale,
  'uk-UA': ukLocale,
}

function timeZoneFallBack(timezone) {
  try {
    new Date().toLocaleString('en', {
      timeZone: timezone,
    })
    return timezone
  } catch (e) {
    console.warn(
      `${timezone}: Invalid timezone, falling back to America/Los_Angeles`
    )
    return 'America/Los_Angeles'
  }
}

const I18nProvider = ({ children }) => {
  const { locale, formats, formatMessage, ...rest } = useIntl()
  const dateFNSLocale = dateFNSLocales[locale]
  const {
    time: {
      'user-timezone': { timeZone: timezone },
    },
  } = formats
  const validTimeZone = timeZoneFallBack(timezone)

  return (
    <I18nContext.Provider
      value={{
        culture: locale,
        dateFNSLocale,
        format: (d, f) => format(d, f, { locale: dateFNSLocale }),
        formats,
        formatWithOffset: d =>
          DateTime.fromJSDate(d)
            .setZone(validTimeZone)
            .toISO(),
        formatDistance: (f, t, s = false) =>
          formatDistance(f, t, { locale: dateFNSLocale, addSuffix: s }),
        formatTimezone: d =>
          d.toLocaleString(locale, {
            timeZone: validTimeZone,
          }),
        formatMessage: (s, f = '!! I18N ID not set !!') =>
          !s ? f : formatMessage(s),
        timezone: validTimeZone,
        ...rest,
      }}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </I18nContext.Provider>
  )
}

export { I18nProvider, I18nContext }
