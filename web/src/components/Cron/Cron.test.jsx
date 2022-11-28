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
  value: ['0', '0', '1/1', '*', '*'],
}

describe.only('Cron Component', () => {
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
  // describe('Weekly', () => {
  //   it('Should return default cron expression for daily', async () => {
  //     render(
  //       <I18nProvider>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Weekly'))
  //     expect(screen.getByText('Execute: At 12:00 AM, only on Monday')).toBeInTheDocument()
  //   })
  //   it('Should return default cron expression for Every Tuesday and friday', async () => {
  //     render(
  //       <I18nProvider>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Weekly'))
  //     await userEvent.click(screen.getByText('Tuesday'))
  //     await userEvent.click(screen.getByText('Monday'))
  //     expect(screen.getByText('Execute: At 12:00 AM, only on Tuesday')).toBeInTheDocument()
  //   })
  // })

  // describe('Quarterly', () => {
  //   it('Should return default cron expression for Quarterly', async () => {
  //     render(
  //       <I18nProvider>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Quarterly'))
  //     expect(screen.getByText('Execute: At 12:00 AM, on day 1 of the month, every 3 months')).toBeInTheDocument()
  //   })
  // })
  // describe('Monthly', () => {
  //   it('Should return default cron expression for Day of Every Months(s)', async () => {
  //     render(
  //       <I18nProvider>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Monthly'))

  //     expect(screen.getByText('Execute: At 12:00 AM, on day 1 of the month')).toBeInTheDocument()
  //   })
  // })
  // describe('Daily', () => {
  //   it('Should return default cron expression for Every Day(s)', async () => {
  //     render(
  //       <I18nProvider>
  //         <h1>lalala2</h1>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Daily'))

  //     expect(screen.getByText('Execute: At 12:00 AM, every day')).toBeInTheDocument()
  //   })
  //   it('Should return default cron expression for Every week day', async () => {
  //     render(
  //       <I18nProvider>
  //         <h1>lalala</h1>
  //         <Cron {...props} />
  //       </I18nProvider>
  //     )
  //     await userEvent.click(screen.getByText('Daily'))
  //     await userEvent.click(screen.getByText('Every week day'))

  //     expect(screen.getByText('Execute: At 12:00 AM, Monday through Friday')).toBeInTheDocument()
  //   })
  // })
})
