import React from 'react'
import { render, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect'
import { I18nProvider } from '../../../../providers/I18nProvider'
import { Default } from '../../Table.stories'

describe('test headers and sortable states', () => {
  it('should render 4 columns in the correct order', () => {
    const { getByRole } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )

    const table = getByRole('table')
    const columnHeaders = within(table).getAllByRole('columnheader')
    expect(columnHeaders).toHaveLength(4)
    expect(columnHeaders.map(d => d.textContent)).toEqual(['Name', 'Last Triggered', 'Total Triggers', 'Contacts'])
  })
  it('contacts column is not sortable', () => {
    const { getByRole } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )
    const table = getByRole('table')
    const [rowGroup] = within(table).getAllByRole('rowgroup')
    const columns = within(rowGroup)
    const contactsHeader = columns.getByText(/contacts/i)
    const contactsColumn = contactsHeader.closest('th')
    expect(contactsColumn.getAttribute('title')).toBe(null)
  })
  it('sort columns, change page size, move to next page and verify correct values and states', async () => {
    const { getByRole, getByTestId } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )
    const table = getByRole('table')
    const [rowGroup] = within(table).getAllByRole('rowgroup')
    const columns = within(rowGroup)
    const lastTriggeredHeader = columns.getByText(/last triggered/i)
    const nowShowing = getByTestId('now-showing')
    const lastTriggeredColumn = lastTriggeredHeader.closest('th')
    const pageCount25Button = getByRole('button', { name: /25/i })
    const pageNextButton = getByRole('button', { name: /next/i })
    userEvent.click(lastTriggeredColumn)
    userEvent.click(pageCount25Button)
    userEvent.click(pageNextButton)

    await waitFor(() => expect(nowShowing).toHaveTextContent('Showing 26-50 of 87 notifications'))
  })
  it('test reorder buttons to be in correct states', () => {
    const { getByRole } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )
    const table = getByRole('table')
    const [rowGroup] = within(table).getAllByRole('rowgroup')
    const columns = within(rowGroup)
    const nameHeader = columns.getByText(/name/i)
    const nameColumn = nameHeader.closest('th')
    const nameOrderLeftButton = within(nameColumn).getByTestId('order_left_1')
    const contactsHeader = columns.getByText(/contacts/i)
    const contactsColumn = contactsHeader.closest('th')
    const contactsOrderRightButton = within(contactsColumn).getByTestId('order_right_3')
    expect(nameOrderLeftButton).toBeEnabled()
    expect(contactsOrderRightButton).toBeDisabled()
  })
  it('reorder name column right, and test headers order', () => {
    const { getByRole, getByTestId } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )
    const table = getByRole('table')
    const nameOrderRightButton = getByTestId('order_right_0')
    userEvent.click(nameOrderRightButton)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(d => d.textContent)
    ).toEqual(['Last Triggered', 'Name', 'Total Triggers', 'Contacts'])
  })
  it('check allowed hide-column states, hide column, and test headers', async () => {
    const { getByTestId, queryByTestId } = render(
      <I18nProvider>
        <Default {...Default.args} />
      </I18nProvider>
    )
    // const table = getByRole('table')
    const contactsHideColumnButton = getByTestId('hide_column_contacts')
    userEvent.click(contactsHideColumnButton)
    await waitFor(async () => {
      expect(queryByTestId('hide_column_lastTriggeredOn')).not.toBeInTheDocument()
      /*
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map(d => d.textContent)
      ).toHaveLength(3)
      */
    })
  })
})
