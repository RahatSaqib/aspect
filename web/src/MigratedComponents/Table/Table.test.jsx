import React from 'react'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'

import { Default } from './Table.stories'

const { getAllByRole, getByRole, getByTestId } = render(
  <Default {...Default.args} />
)
describe('test headers and sortable states', () => {
  const table = getByRole('table')
  const [columns] = within(table).getAllByRole('rowgroup')
  const columnNames = within(columns)
  it('renders a table with expected headers', () => {
    expect(columnNames.getByText(/name/i))
    expect(columnNames.getByText(/last triggered/i))
    expect(columnNames.getByText(/total triggers/i))
    expect(columnNames.getByText(/contacts/i))
  })
  it('contacts column is not sortable', () => {
    const contacts = columnNames.getByText(/contacts/i).closest('th')
    expect(contacts.getAttribute('title')).toBe(null)
  })
})

describe('tests header clicks and states', () => {
  const table = getByRole('table')
  const [columns] = within(table).getAllByRole('rowgroup')
  const columnNames = within(columns)
  userEvent.click(columnNames.getByText(/last triggered/i).closest('th'))
  userEvent.click(getByRole('button', { name: /25/i }))
  userEvent.click(getByRole('button', { name: /next/i }))
  const nowShowing = getByTestId('now-showing')

  it('sort columns, change page size, move to next page and verify correct values and states', () => {
    expect(nowShowing).toHaveTextContent('Showing 26-50 of 87 notifications')
  })
})

describe('tests column ordering and states', () => {
  const columns = getAllByRole('columnheader')
  it('should render the columns in the correct order', () => {
    const { getByText } = within(columns[0])
    expect(columns).toHaveLength(4)
    expect(getByText(/contacts/i))
  })
})
