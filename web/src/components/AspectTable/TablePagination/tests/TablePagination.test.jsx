import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'
import { I18nProvider } from '../../../../providers/I18nProvider/index'
import { Default } from '../stories/TablePagination.stories'

it('renders buttons in correct states', () => {
  const { getByRole } = render(
    <I18nProvider>
      <Default {...Default.args} />
    </I18nProvider>
  )
  expect(getByRole('button', { name: /first/i })).toBeDisabled()
  expect(getByRole('button', { name: /previous/i })).toBeDisabled()
  expect(getByRole('button', { name: /next/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /last/i })).toBeEnabled()
})

it('renders correct "Now Showing" counts', () => {
  const { getByTestId } = render(
    <I18nProvider>
      <Default {...Default.args} />
    </I18nProvider>
  )
  expect(getByTestId('now-showing')).toHaveTextContent('Showing 1-10 of 90 notifications')
})

it('update row count and verify correct values', async () => {
  const { getByRole, getByTestId } = render(
    <I18nProvider>
      <Default {...Default.args} />
    </I18nProvider>
  )
  userEvent.click(getByRole('button', { name: /25/i }))
  await waitFor(() => {
    expect(getByTestId('now-showing')).toHaveTextContent('Showing 1-25 of 90 notifications')
  })
})

it('update page selector and verify correct values', async () => {
  const { getByRole, getByTestId } = render(
    <I18nProvider>
      <Default {...Default.args} />
    </I18nProvider>
  )
  userEvent.click(getByRole('button', { name: /next/i }))
  await waitFor(() => {
    expect(getByTestId('now-showing')).toHaveTextContent('Showing 11-20 of 90 notifications')
    expect(getByRole('button', { name: /first/i })).toBeEnabled()
    expect(getByRole('button', { name: /previous/i })).toBeEnabled()
  })
})

it('go to last page and verify correct values and states', async () => {
  const { getByRole, getByTestId } = render(
    <I18nProvider>
      <Default {...Default.args} />
    </I18nProvider>
  )
  userEvent.click(getByRole('button', { name: /last/i }))
  await waitFor(() => {
    expect(getByTestId('now-showing')).toHaveTextContent('Showing 81-90 of 90 notifications')
    expect(getByRole('button', { name: /next/i })).toBeDisabled()
    expect(getByRole('button', { name: /last/i })).toBeDisabled()
  })
})
