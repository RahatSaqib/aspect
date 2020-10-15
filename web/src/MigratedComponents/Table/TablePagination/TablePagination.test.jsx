import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Default } from './TablePagination.stories'

render(<Default {...Default.args} />)

const firstButton = screen.getByRole('button', { name: /first/i })
const previousButton = screen.getByRole('button', { name: /previous/i })
const nextButton = screen.getByRole('button', { name: /next/i })
const lastButton = screen.getByRole('button', { name: /last/i })
const nowShowing = screen.getByTestId('now-showing')

it('renders buttons in correct states', () => {
  expect(firstButton).toBeDisabled()
  expect(previousButton).toBeDisabled()
  expect(nextButton).toBeEnabled()
  expect(lastButton).toBeEnabled()
})

it('renders correct "Now Showing" counts', () => {
  expect(nowShowing).toHaveTextContent('Showing 1-10 of 90 notifications')
})
