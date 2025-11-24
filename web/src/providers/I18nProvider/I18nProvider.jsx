import React, { useState, useEffect } from 'react'
import { utcToZonedTime, format, formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import formatDistance from 'date-fns/formatDistance'
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl'
import config from '../../config'
import translation from '../../utils/i18n/translation.json'
import { getTimezoneById } from '../../utils/utils/timezone'
import dateFNSLocales from './dateFNSLocales'

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache()

const I18nProvider = ({ timezoneId, children }) => {
  const validTimeZone = getTimezoneById(timezoneId)
  const [locale, setLocale] = useState(localStorage.getItem('asCulture') || config.defaultCulture)
  const [intl, setIntl] = useState({})

  useEffect(() => {
    // Listen for changes to `localStorage`
    const handleStorageChange = () => {
      const newLocale = localStorage.getItem('asCulture') || 'en'
      setLocale(newLocale)
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    const dateFNSLocale = dateFNSLocales[locale]
    const finalMessages = translation[locale]
    const intlObj = createIntl({ locale, messages: finalMessages, onError: () => {} }, cache)
    setIntl({
      ...intlObj,
      format: (dateIn, formatIn) => formatInTimeZone(zonedTimeToUtc(dateIn, validTimeZone), validTimeZone, formatIn),
      formatWithOffset: dateIn =>
        format(utcToZonedTime(dateIn, validTimeZone), "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: validTimeZone }),
      formatDistance: (firstDateIn, secondDateIn, showSuffix = false) =>
        formatDistance(firstDateIn, secondDateIn, { locale: dateFNSLocale, addSuffix: showSuffix }),
      formatTimezone: dateIn => dateIn.toLocaleString(locale, { timeZone: validTimeZone }),
      formatMessage: (stringIn, values = {}, fallback = `!! I18N ID not set !!`) =>
        !stringIn ? fallback : intlObj.formatMessage(stringIn, values),
      timezone: validTimeZone,
    })
  }, [locale, validTimeZone])

  // if we use a react provider we need a intlProvider wrapping it. Instead of 2 providers, the correct way is to use a RawIntProvider
  // https://formatjs.io/docs/react-intl/components/#rawintlprovider
  return <RawIntlProvider value={intl}>{children}</RawIntlProvider>
}

export default I18nProvider
