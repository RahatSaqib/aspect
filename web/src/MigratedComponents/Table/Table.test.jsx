import React from 'react'
import { render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'

import { Default } from './Table.stories'

const { getAllByRole, getByRole, getByTestId } = render(
  <Default {...Default.args} />
)
const table = getByRole('table')
describe('test headers and sortable states', () => {
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
  const [columns] = within(table).getAllByRole('rowgroup')
  const { getByText } = within(columns)
  userEvent.click(getByText(/last triggered/i).closest('th'))
  userEvent.click(getByRole('button', { name: /25/i }))
  userEvent.click(getByRole('button', { name: /next/i }))
  const nowShowing = getByTestId('now-showing')

  it('sort columns, change page size, move to next page and verify correct values and states', () => {
    expect(nowShowing).toHaveTextContent('Showing 26-50 of 87 notifications')
  })
})

describe('tests column ordering and states', () => {
  const columns = getAllByRole('columnheader')

  it('should render 4 columns in the correct order', () => {
    expect(columns).toHaveLength(4)
    expect(columns.map(d => d.textContent)).toEqual([
      'Contacts',
      'Name',
      'Last Triggered',
      'Total Triggers',
    ])
  })

  it('reorder column and test correct states', () => {
    const { getAllByRole } = within(columns[1])
    const columnTwoButtons = getAllByRole('button')
    userEvent.click(columnTwoButtons[1])
    const buttonsFarLeft = within(columns[0]).getAllByRole('button')
    const buttonsFarRight = within(columns[3]).getAllByRole('button')
    expect(buttonsFarLeft[0].getAttribute('class')).toMatch(/--nohover/i)
    expect(buttonsFarRight[1].getAttribute('class')).not.toMatch(/--nohover/i)
  })
})
