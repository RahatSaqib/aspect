import React, { Fragment } from 'react'
import IntlPolyfill from 'intl'
import 'intl/locale-data/jsonp/de'
import 'intl/locale-data/jsonp/ru'
import 'intl/locale-data/jsonp/fr'
import 'intl/locale-data/jsonp/uk'
import 'intl/locale-data/jsonp/en'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import MockDate from 'mockdate'
import subDays from 'date-fns/subDays'

import { i18nWrapper } from '../index'

const ComponentWrapper = ({ locale: passedLocale, timezone: passedTimezone }) => {
  if (global.Intl) {
    Intl.NumberFormat = IntlPolyfill.NumberFormat
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat
  } else {
    global.Intl = IntlPolyfill
  }
  const { culture, format, formatNumber, formatDate, formatDistance, timezone } = i18nWrapper(
    false,
    passedLocale,
    passedTimezone
  )

  MockDate.set(new Date('2021-02-25 14:10:29'))
  const now = new Date()
  const then = subDays(now, 56)

  return (
    <Fragment>
      <div data-testid="culture">{culture}</div>
      <div data-testid="timezone">{timezone}</div>
      <div data-testid="number-display">{formatNumber(33902837)}</div>
      <div data-testid="number-display2">{formatNumber(1230)}</div>
      <div data-testid="date-display">{formatDate(now)}</div>
      <div data-testid="date-display2">{format(now, 'EEEE MMMM do')}</div>
      <div data-testid="date-display3">{formatDistance(now, then)}</div>
    </Fragment>
  )
}

describe('I18nProvider', () => {
  it('should format values for pt-PT correctly', () => {
    render(<ComponentWrapper locale="pt-PT" timezone="Europe/Lisbon" />)
    expect(screen.getByTestId('culture')).toHaveTextContent('pt')
    expect(screen.getByTestId('timezone')).toHaveTextContent('Europe/Lisbon')
    expect(screen.getByTestId('number-display')).toHaveTextContent('33 902 837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1 230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('25/02/2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('quinta-feira fevereiro 25º')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('aproximadamente 2 meses')
  })

  it('should format values for ru-RU correctly', () => {
    render(<ComponentWrapper locale="ru-RU" timezone="Europe/Moscow" />)
    expect(screen.getByTestId('culture')).toHaveTextContent('ru')
    expect(screen.getByTestId('timezone')).toHaveTextContent('Europe/Moscow')
    expect(screen.getByTestId('number-display')).toHaveTextContent('33 902 837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1 230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('25.02.2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('четверг февраля 25-е')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('около 2 месяцев')
  })

  it('should format values for fr-FR correctly', () => {
    render(<ComponentWrapper locale="fr" timezone="Europe/Paris" />)
    expect(screen.getByTestId('culture')).toHaveTextContent('fr')
    expect(screen.getByTestId('timezone')).toHaveTextContent('Europe/Paris')
    expect(screen.getByTestId('number-display')).toHaveTextContent('33 902 837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1 230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('25/02/2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('jeudi février 25ème')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('environ 2 mois')
  })

  it('should format values for en-US correctly', () => {
    render(<ComponentWrapper locale="en" timezone="America/Los_Angeles" />)
    expect(screen.getByTestId('culture')).toHaveTextContent('en')
    expect(screen.getByTestId('timezone')).toHaveTextContent('America/Los_Angeles')
    expect(screen.getByTestId('number-display')).toHaveTextContent('33,902,837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1,230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('2/25/2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('Thursday February 25th')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('about 2 months')
  })

  it('should format values for de-DE correctly', () => {
    render(<ComponentWrapper locale="de" timezone="Europe/Berlin" />)
    expect(screen.getByTestId('culture')).toHaveTextContent('de')
    expect(screen.getByTestId('timezone')).toHaveTextContent('Europe/Berlin')
    expect(screen.getByTestId('number-display')).toHaveTextContent('33.902.837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1.230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('25.2.2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('Donnerstag Februar 25.')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('etwa 2 Monate')
  })

  it('should fall back elegantly for no-PE to en', () => {
    render(<ComponentWrapper locale="nope" timezone="Mars/Cassini" />)
    expect(screen.getByTestId('number-display')).toHaveTextContent('33,902,837')
    expect(screen.getByTestId('number-display2')).toHaveTextContent('1,230')
    expect(screen.getByTestId('date-display')).toHaveTextContent('2/25/2021')
    expect(screen.getByTestId('date-display2')).toHaveTextContent('Thursday February 25th')
    expect(screen.getByTestId('date-display3')).toHaveTextContent('about 2 months')
  })
})
