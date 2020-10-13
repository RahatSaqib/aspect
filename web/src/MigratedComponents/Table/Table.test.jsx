import React from 'react'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { Default } from './Table.stories'

render(<Default {...Default.args} />)
const table = screen.getByRole('table')
const [columns, ...rows] = within(table).getAllByRole('rowgroup')
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
