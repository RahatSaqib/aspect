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

const I18nProvider = ({ children }) => {
  const { locale, formats, formatMessage, ...rest } = useIntl()
  const dateFNSLocale = dateFNSLocales[locale]
  const {
    time: {
      'user-timezone': { timeZone: timezone },
    },
  } = formats

  return (
    <I18nContext.Provider
      value={{
        culture: locale,
        dateFNSLocale,
        format: (d, f) => format(d, f, { locale: dateFNSLocale }),
        formats,
        formatWithOffset: d =>
          DateTime.fromJSDate(d)
            .setZone(timezone)
            .toISO(),
        formatDistance: (f, t) =>
          formatDistance(f, t, { locale: dateFNSLocale }),
        formatTimezone: d =>
          d.toLocaleString(locale, {
            timeZone: timezone,
          }),
        formatMessage: s => (!s ? '!! I18N ID not set !!' : formatMessage(s)),
        timezone,
        ...rest,
      }}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </I18nContext.Provider>
  )
}

const useI18n = () => {
  const context = React.useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within a I18nProvider')
  }
  return context
}

export { I18nProvider, useI18n }
