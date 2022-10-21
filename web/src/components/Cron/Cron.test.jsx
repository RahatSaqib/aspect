import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { I18nProvider } from '../../providers/I18nProvider'
import Cron from './Cron'

const props = {
  showResultText: false,
  showResultCron: true,
  onChange: () => true,
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
      expect(screen.getByText('(0 0 00 ? * * *)')).toBeInTheDocument()
    })
    it('Should return default cron expression for Every Tuesday and friday', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Weekly'))
      await userEvent.click(screen.getByText('Tuesday'))
      expect(screen.getByText('(0 0 00 ? * TUE *)')).toBeInTheDocument()
    })
  })
  describe('Monthly', () => {
    it('Should return default cron expression for monthly', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Monthly'))
      expect(screen.getByText('(0 0 00 1 1/1 ? *)')).toBeInTheDocument()
    })
    it('Should return default cron expression for On the last weekday of every month', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Monthly'))
      await userEvent.click(screen.getByText('On the last weekday of every month'))

      expect(screen.getByText('(0 0 00 LW * ? *)')).toBeInTheDocument()
    })
    it('Should return default cron expression for Last day of every month', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Monthly'))
      await userEvent.click(screen.getByText('Last day of every month'))

      expect(screen.getByText('(0 0 00 L * ? *)')).toBeInTheDocument()
    })
    it('Should return default cron expression for Days before the end of the month', async () => {
      render(
        <I18nProvider>
          <Cron {...props} />
        </I18nProvider>
      )
      await userEvent.click(screen.getByText('Monthly'))
      await userEvent.click(screen.getByText('Day(s) before the end of the month'))

      expect(screen.getByText('(0 0 00 L-1 * ? *)')).toBeInTheDocument()
    })
  })
})
