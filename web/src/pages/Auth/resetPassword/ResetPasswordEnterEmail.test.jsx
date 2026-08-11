import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import noop from 'lodash/noop'
import messages from './messages'
import ResetPasswordEnterEmail, { validate } from './ResetPasswordEnterEmail'

describe('ResetPasswordEnterEmail module', () => {
  const intl = { formatMessage: message => message.defaultMessage }
  const props = {
    intl,
    onShowAdminHelpDialog: noop,
    onSubmit: noop,
  }

  const renderForm = () => {
    const { container } = render(<ResetPasswordEnterEmail {...props} />)

    return {
      emailAddressField: container.querySelector('input[name="emailAddress"]'),
      submitButton: screen.getByRole('button', { name: messages.next.defaultMessage }),
    }
  }

  describe('ResetPasswordEnterEmail component', () => {
    it('should disable the submit button while the form is pristine', () => {
      const { submitButton } = renderForm()

      expect(submitButton.disabled).toBe(true)
    })

    it('should keep the submit button disabled while the email address is invalid', async () => {
      const { emailAddressField, submitButton } = renderForm()

      fireEvent.change(emailAddressField, { target: { value: 'test' } })

      await waitFor(() => expect(submitButton.disabled).toBe(true))
    })

    it('should enable the submit button once a valid email address is entered', async () => {
      const { emailAddressField, submitButton } = renderForm()

      fireEvent.change(emailAddressField, { target: { value: 'test@example.com' } })

      await waitFor(() => expect(submitButton.disabled).toBe(false))
    })

    it('should show the error when the text field is touched and the email is invalid', async () => {
      const { emailAddressField } = renderForm()

      expect(screen.queryByText(messages.invalidEmailAddress.defaultMessage)).toBeNull()

      fireEvent.change(emailAddressField, { target: { value: 'test' } })
      fireEvent.blur(emailAddressField)

      await waitFor(() => expect(screen.getByText(messages.invalidEmailAddress.defaultMessage)).toBeTruthy())
    })
  })

  describe('validate function', () => {
    const invalidEmailAddress = intl.formatMessage(messages.invalidEmailAddress)
    it('should contain error message with invalid emails', () => {
      expect(validate({ emailAddress: '' }, props).emailAddress).toEqual(invalidEmailAddress)
      expect(validate({ emailAddress: 'test' }, props).emailAddress).toEqual(invalidEmailAddress)
      expect(validate({ emailAddress: 'test@example' }, props).emailAddress).toEqual(invalidEmailAddress)
    })

    it('should not contain an `emailAddress` property of error with valid emails', () => {
      expect(validate({ emailAddress: 'test@example.com' }, props)).not.toHaveProperty('emailAddress')
      expect(validate({ emailAddress: 'test@gmail.com' }, props)).not.toHaveProperty('emailAddress')
    })
  })
})
