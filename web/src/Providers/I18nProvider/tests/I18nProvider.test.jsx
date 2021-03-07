import React from 'react'
import { IntlProvider } from 'react-intl'
import { addLocaleData, renderHook } from '@testing-library/react-hooks'
import '@testing-library/jest-dom/extend-expect'

import de from 'date-fns/locale/de'
import us from 'date-fns/locale/en-US'
import fr from 'date-fns/locale/fr'
import ru from 'date-fns/locale/ru'
import uk from 'date-fns/locale/uk'

import { I18nProvider, useI18n } from '../index'

addLocaleData([ru, fr])

describe('I18nProvider', () => {
  const wrapper = props => {
    const { children, locale } = props
    console.log(locale)

    return (
      <IntlProvider
        key={locale}
        locale={locale}
        messages={{}}
        formats={{
          time: {
            'user-timezone': {
              timeZone: timezone,
            },
          },
        }}
      >
        <I18nProvider>{children}</I18nProvider>
      </IntlProvider>
    )
  }

  const {
    result: {
      current: {
        culture,
        format,
        formatNumber,
        formatDate,
        formatDistance,
        formatMessage,
        formatTime,
        formatTimezone,
        formatWithOffset,
        timezone,
      },
    },
  } = renderHook(() => useI18n(), {
    wrapper,
    initialProps: { locale: 'ru' },
  })

  it('should format numbers correctly', () => {
    expect(formatNumber(0.23)).toBe('0.23')
    expect(formatNumber(100293475)).toBe('100 293 475')
  })
})
