import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import useAuthState from '../../../hooks/useAuthState'
import ReportFilterDialog from '../ReportFilterDialog'

jest.mock('../../../hooks/useAuthState')

// text-type params keep the form registry free of the heavy select components
const report = {
  externalId: 'some_report',
  name: 'Some Report',
  parameters: [{ name: 'comment', type: 'text', label: 'Comment', required: true }],
}

const renderDialog = (props = {}) =>
  render(
    <ReportFilterDialog
      open
      report={report}
      fileExtension="xlsx"
      initialValues={{}}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      {...props}
    />
  )

describe('ReportFilterDialog required UX', () => {
  beforeEach(() => {
    useAuthState.mockReturnValue({ countryId: 1, userPermissions: [] })
  })

  it('disables the primary action and shows the hint while required fields are empty', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: /download excel/i })).toBeDisabled()
    expect(screen.getByText('Fill in the required fields to continue')).toBeInTheDocument()
  })

  it('enables the primary action and hides the hint once required fields are filled', () => {
    const onSubmit = jest.fn()
    renderDialog({ onSubmit })
    fireEvent.change(screen.getByLabelText('Comment *'), { target: { value: 'hello' } })

    const submit = screen.getByRole('button', { name: /download excel/i })
    expect(submit).toBeEnabled()
    expect(screen.queryByText('Fill in the required fields to continue')).not.toBeInTheDocument()

    fireEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledWith({ comment: 'hello' })
  })

  it('keeps Cancel enabled while invalid', () => {
    const onClose = jest.fn()
    renderDialog({ onClose })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows Generate label in async generate mode', () => {
    renderDialog({ requestType: 'generate' })
    expect(screen.getByRole('button', { name: /generate excel/i })).toBeInTheDocument()
  })

  it('resets values when reopened with new initialValues', () => {
    const { rerender } = render(
      <ReportFilterDialog
        open
        report={report}
        fileExtension="xlsx"
        initialValues={{ comment: 'first' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Comment *')).toHaveValue('first')

    rerender(
      <ReportFilterDialog
        open
        report={report}
        fileExtension="xlsx"
        initialValues={{ comment: 'second' }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Comment *')).toHaveValue('second')
  })
})
