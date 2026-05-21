import React from 'react'
import { Button, TextField } from '@mui/material'
import { compose, withState, pure } from 'recompose'
import recomposeForm from '../../../components/recomposeForm'
import validateEmailAddress from '../../../utils/utils/validate'
import messages from './messages'
import styles from './ResetPassword.module.css'

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
        valueFromChangeEvent: it => it.target.value,
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
}) => (
  <form onSubmit={handleSubmit} className={styles.Form}>
    <div className={styles.Form__Content}>
      <p>{intl.formatMessage(messages.enterEmailAddressContent)}</p>
      <a href="#showAdminHelp" onClick={onShowAdminHelpDialog}>
        {intl.formatMessage(messages.iDontHaveAnEmailAddress)}
      </a>
      <TextField
        autoFocus
        fullWidth
        type="email"
        name="emailAddress"
        label={intl.formatMessage(messages.emailAddress)}
        value={values.emailAddress}
        onChange={onEmailAddressChange}
        error={meta.emailAddress.touched && !!meta.emailAddress.error}
        helperText={meta.emailAddress.touched && meta.emailAddress.error}
        margin="normal"
        FormHelperTextProps={{
          margin: 'dense',
        }}
        inputProps={{ maxLength: 500 }}
      />
    </div>
    <div className={styles.Form__ActionRow}>
      <Button
        type="submit"
        color="secondary"
        variant="contained"
        disabled={form.pristine || !form.valid || form.submitting}
      >
        {intl.formatMessage(messages.next)}
      </Button>
      {action}
    </div>
  </form>
)

export default enhance(ResetPasswordEnterEmail)
