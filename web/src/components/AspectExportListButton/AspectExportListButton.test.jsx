import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import noop from 'lodash/noop'
import { vi } from 'vitest'
import AspectExportListButton from './AspectExportListButton'

describe('ExportListButton', () => {
  const props = {
    onExport: () => noop,
  }

  it('should not render the button', () => {
    const { container } = render(<AspectExportListButton {...props} visible={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should render export list correctly', () => {
    const { asFragment } = render(<AspectExportListButton {...props} visible />)

    expect(asFragment()).toMatchSnapshot()
  })

  it('should open the export menu when the button is clicked', async () => {
    const user = userEvent.setup()
    render(<AspectExportListButton {...props} visible />)

    expect(screen.queryByRole('menuitem', { name: 'Excel' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('menuitem', { name: 'Excel' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'CSV' })).toBeInTheDocument()
  })

  it('should disable the menu items that are turned off by props', async () => {
    const user = userEvent.setup()
    render(<AspectExportListButton {...props} visible disableCSV disableExcel />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('menuitem', { name: 'Excel' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: 'CSV' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('should invoke `onExport` with the chosen format', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn(() => undefined)
    render(<AspectExportListButton onExport={onExport} visible />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('menuitem', { name: 'CSV' }))

    expect(onExport).toHaveBeenCalledWith('csv')
  })
})
