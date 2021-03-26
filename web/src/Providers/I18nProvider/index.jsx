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
        format: (dateIn, formatIn) =>
          format(dateIn, formatIn, { locale: dateFNSLocale }),
        formats,
        formatWithOffset: dateIn =>
          DateTime.fromJSDate(dateIn)
            .setZone(validTimeZone)
            .toISO(),
        formatDistance: (firstDateIn, secondDateIn, showSuffix = false) =>
          formatDistance(firstDateIn, secondDateIn, {
            locale: dateFNSLocale,
            addSuffix: showSuffix,
          }),
        formatTimezone: dateIn =>
          dateIn.toLocaleString(locale, {
            timeZone: validTimeZone,
          }),
        formatMessage: (stringIn, fallback = '!! I18N ID not set !!') =>
          !stringIn ? fallback : formatMessage(stringIn),
        timezone: validTimeZone,
        ...rest,
      }}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </I18nContext.Provider>
  )
}

export { I18nProvider, I18nContext }
