import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withState, pure } from 'recompose'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'

import validateEmailAddress from '../../shared/utils/validate'
import recomposeForm from '../../components/recomposeForm'
import messages from './messages'

const cssClasses = classnames.bind(require('./ResetPassword.css'))

export function validate({ emailAddress }, { intl }) {
  const errors = {}
  if (!validateEmailAddress(emailAddress).isValid()) {
    errors.emailAddress = intl.formatMessage(messages.invalidEmailAddress)
  }
  return errors
}

const enhance = compose(
  pure,
  withState('values', 'onChange', {
    emailAddress: '',
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'emailAddress',
        valueFromChangeEvent: _.identity,
      },
    ],
    validate,
  })
)

export const ResetPasswordEnterEmail = ({
  intl,
  action,
  onShowAdminHelpDialog,
  form,
  values,
  meta,
  onEmailAddressChange,
  handleSubmit,
}) =>
  <form onSubmit={handleSubmit} className={cssClasses('Form')}>
    <div className={cssClasses('Form__Content')}>
      <p>
        {intl.formatMessage(messages.enterEmailAddressContent)}
      </p>
      <a href="#showAdminHelp" onClick={onShowAdminHelpDialog}>
        {intl.formatMessage(messages.iDontHaveAnEmailAddress)}
      </a>
      <Input
        type="email"
        name="emailAddress"
        label={intl.formatMessage(messages.emailAddress)}
        value={values.emailAddress}
        onChange={onEmailAddressChange}
        error={meta.emailAddress.touched && meta.emailAddress.error}
        maxLength={500}
      />
    </div>
    <div className={cssClasses('Form__ActionRow')}>
      <Button
        type="submit"
        primary
        raised
        disabled={form.pristine || !form.valid || form.submitting}
        label={intl.formatMessage(messages.next)}
      />
      {action}
    </div>
  </form>

export default enhance(ResetPasswordEnterEmail)
