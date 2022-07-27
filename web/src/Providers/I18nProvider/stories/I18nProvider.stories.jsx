import React from 'react'
import { defineMessages, IntlProvider } from 'react-intl'
import subDays from 'date-fns/subDays'

import { I18nProvider } from '../index'
import useI18n from '../../../Hooks/i18n/useI18n'
import translation from '../../../shared/i18n/translation'

const messages = defineMessages({
  demoString: {
    id: 'pages.Storybook.demoString',
    defaultMessage: 'Hello Storybook!',
  },
  missingDefault: {
    id: 'pages.Storybook.missingDefault',
    defaultMessage: 'missing',
  },
})

function timezoneFromLocale(locale) {
  // eslint-disable-next-line default-case
  switch (locale) {
    case 'de-DE':
      return { timezone: 'Europe/Berlin', flag: '🇩🇪' }
    case 'en-US':
      return { timezone: 'America/Los_Angeles', flag: '🇺🇸' }
    case 'en':
      return { timezone: 'America/Los_Angeles', flag: '🇺🇸' }
    case 'fr-FR':
      return { timezone: 'Europe/Paris', flag: '🇫🇷' }
    case 'ru-RU':
      return { timezone: 'Europe/Moscow', flag: '🇷🇺' }
    case 'uk-UA':
      return { timezone: 'Europe/Kiev', flag: '🇺🇦' }
    case 'no-PE':
      return { timezone: 'Mars/Cassini', flag: '🥮' }
  }
}

export default {
  title: 'Providers/i18n/I18nProvider',
  argTypes: {
    locale: {
      control: {
        type: 'select',
        options: ['de-DE', 'en-US', 'fr-FR', 'ru-RU', 'uk-UA', 'no-PE'],
      },
    },
  },
  component: I18nProvider,
}

const styles = {
  container: {
    fontFamily: 'arial',
    display: 'flex',
    flexDirection: 'column',
  },
  items: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: '8px',
  },
  item: {
    fontFamily: 'arial',
    fontSize: '18px',
    margin: '0 5px',
    padding: '10px 20px',
    background: '#f5f8fc',
    borderRadius: '3px',
  },
  pre: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: 'darkmagenta',
    padding: '10px',
    background: '#f5f8fc',
  },
}

const DemoComponent = ({ config: { flag } }) => {
  const {
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
  } = useI18n()

  const now = new Date()
  const then = subDays(now, 56)
  return (
    <div>
      <div style={styles.container}>
        Locale: {culture} {flag}
      </div>
      <div style={styles.container}>
        <h4>
          Numbers:
          <pre style={styles.pre}>formatNumber(int, options) [react-intl]</pre>
        </h4>

        <div style={styles.items}>
          <div style={styles.item}>{formatNumber(0.23)}</div>
          <div style={styles.item}>{formatNumber(10)}</div>
          <div style={styles.item}>{formatNumber(2900)}</div>
          <div style={styles.item}>{formatNumber(100293475)}</div>
          <div style={styles.item}>{formatNumber(908700293475)}</div>
          <div style={styles.item}>
            {formatNumber(2394, {
              style: 'unit',
              unit: 'kilobyte',
              unitDisplay: 'narrow',
            })}
          </div>
        </div>
      </div>
      <div style={styles.container}>
        <h4>
          Dates:
          <pre style={styles.pre}>
            <div>formatDate(date) [react-intl]</div>
            <div>formatTimezone(date) [vanilla-js]</div>
            <div>format(date, dateFormat) [date-fns]</div>
            <div>formatTime(date) [react-intl]</div>
            <div>formatDistance(date1, date2) [date-fns]</div>
            <div>formatWithOffset(date) [luxon]</div>
          </pre>
        </h4>
        <div style={styles.items}>
          <div style={styles.item}>{formatDate(now)}</div>
          <div style={styles.item}>{formatTimezone(now)}</div>
          <div style={styles.item}>{format(now, 'EEEE MMMM do')}</div>
        </div>
        <div style={styles.items}>
          <div style={styles.item}>{formatTime(now)}</div>
          <div style={styles.item}>{formatDistance(now, then)}</div>
          <div style={styles.item}>{formatWithOffset(now)}</div>
          <div style={styles.item}>{timezone}</div>
        </div>
      </div>
      <div style={styles.container}>
        <h4>
          Text:
          <pre style={styles.pre}>
            <div>formatMessage(messages.id) [react-intl]</div>
          </pre>
        </h4>
        <div style={styles.items}>
          <div style={styles.item}>{formatMessage(messages.demoString)}</div>
          <div style={styles.item}>{formatMessage(messages.missingDefault)}</div>
          <div style={styles.item}>{formatMessage(messages.dontExist)}</div>
        </div>
      </div>
    </div>
  )
}

const Template = ({ locale }) => {
  const { timezone, flag } = timezoneFromLocale(locale)
  const formattedLocale = locale === 'en-US' ? 'en' : locale
  return (
    <IntlProvider
      key={formattedLocale}
      locale={formattedLocale}
      messages={translation[formattedLocale]}
      formats={{
        time: {
          'user-timezone': {
            timeZone: timezone,
          },
        },
      }}
    >
      <I18nProvider>
        <DemoComponent config={{ flag }} />
      </I18nProvider>
    </IntlProvider>
  )
}

export const Default = Template.bind({})

Default.args = {
  locale: 'en-US',
}
