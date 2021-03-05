import React, { createContext } from 'react'
import { useIntl } from 'react-intl'
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
  'de-DE': deLocale,
  en: usLocale,
  'en-US': usLocale,
  'fr-FR': frLocale,
  'ru-RU': ruLocale,
  'uk-UA': ukLocale,
}

const I18nProvider = ({ children }) => {
  const {
    locale,
    formats: {
      time: {
        'user-timezone': { timeZone: timezone },
      },
    },
    ...rest
  } = useIntl()
  const dateFNSLocale = dateFNSLocales[locale]

  return (
    <I18nContext.Provider
      value={{
        culture: locale,
        dateFNSLocale,
        format: (d, f) => format(d, f, { locale: dateFNSLocale }),
        formatDistance: (f, t) =>
          formatDistance(f, t, { locale: dateFNSLocale }),
        formatTimezone: d => d.toLocaleString(locale),
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
