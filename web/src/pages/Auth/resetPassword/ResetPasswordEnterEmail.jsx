import React from 'react'
import { Button, CircularProgress, TextField } from '@mui/material'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import PropTypeOf from '../../../utils/types'
import validateEmailAddress from '../../../utils/utils/validate'
import messages from './messages'
import styles from './ResetPassword.module.css'

const INITIAL_VALUES = { emailAddress: '' }

export function validate({ emailAddress }, { intl }) {
  const errors = {}
  if (!validateEmailAddress(emailAddress).isValid()) {
    errors.emailAddress = intl.formatMessage(messages.invalidEmailAddress)
  }
  return errors
}

const ResetPasswordEnterEmail = ({ intl, action, onShowAdminHelpDialog, onSubmit }) => {
  const { values, errors, touched, dirty, isValid, isSubmitting, handleBlur, handleChange, handleSubmit } = useFormik({
    initialValues: INITIAL_VALUES,
    validate: formValues => validate(formValues, { intl }),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <p className={styles.Form__Intro}>{intl.formatMessage(messages.enterEmailAddressContent)}</p>
        <TextField
          autoFocus
          fullWidth
          type="email"
          name="emailAddress"
          label={intl.formatMessage(messages.emailAddress)}
          value={values.emailAddress}
          onChange={handleChange}
          onBlur={handleBlur}
          error={!!touched.emailAddress && !!errors.emailAddress}
          helperText={touched.emailAddress && errors.emailAddress}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
          inputProps={{ maxLength: 500 }}
        />
        <a className={styles.Form__HelpLink} href="#showAdminHelp" onClick={onShowAdminHelpDialog}>
          {intl.formatMessage(messages.iDontHaveAnEmailAddress)}
        </a>
      </div>
      <div className={styles.Form__ActionRow}>
        {action}
        <Button
          type="submit"
          color="secondary"
          variant="contained"
          disabled={!dirty || !isValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : null}
        >
          {intl.formatMessage(messages.next)}
        </Button>
      </div>
    </form>
  )
}

ResetPasswordEnterEmail.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  action: PropTypes.node,
  onShowAdminHelpDialog: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

ResetPasswordEnterEmail.defaultProps = {
  action: null,
}

export default ResetPasswordEnterEmail
