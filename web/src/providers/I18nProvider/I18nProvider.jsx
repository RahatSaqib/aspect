import React from 'react'
import { utcToZonedTime, format } from 'date-fns-tz'
import formatDistance from 'date-fns/formatDistance'
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl'
import translation from '../../utils/i18n/translation.json'
import dateFNSLocales from './dateFNSLocales'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

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

export default I18nProvider
