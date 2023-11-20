import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import I18nProvider from '../../providers/I18nProvider'
import Cron from './Cron'

const props = {
  showResultText: false,
  showResultCron: true,
  onChange: () => true,
  value: { cronExpression: ['0', '0', '*/1', '*', '*'] },
}

describe('Cron Component', () => {
  describe('snapshot test', () => {
    it('should shallow render export list correctly', () => {
      const { asFragment } = render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      expect(asFragment()).toMatchSnapshot()
    })
  })

  describe('Weekly', () => {
    it('Should return default cron expression for daily', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Weekly'))
      expect(screen.getByText('Monday')).toBeInTheDocument()
      expect(screen.getByText('Saturday')).toBeInTheDocument()
    })
  })

  describe('Quarterly', () => {
    it('Should return default cron expression for Quarterly', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Quarterly'))
    })
  })
  describe('Monthly', () => {
    it('Should return default cron expression for Day of Every Months(s)', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Monthly'))
    })
  })
  describe('Daily', () => {
    it('Should return default cron expression for Every Day(s)', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Every week day'))
    })
    it('Should return default cron expression for Every week day', async () => {
      render(
        <I18nProvider>
          <h1>lalala</h1>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Daily'))
      await userEvent.click(screen.getByText('Every week day'))
    })
  })
})
