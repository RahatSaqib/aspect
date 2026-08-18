import React from 'react'
import { Button, CircularProgress, TextField } from '@mui/material'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import StrongPasswordInput from '../../../components/shared/StrongPasswordInput'
import passwordComplexityMessages from '../../../messages/passwordComplexityMessages'
import PropTypeOf from '../../../utils/types'
import { isPasswordAcceptable } from '../../../utils/utils/passwordComplexity'
import messages from './messages'
import styles from './ResetPassword.module.css'

const INITIAL_VALUES = { newPassword: '', confirmNewPassword: '' }

function validate({ newPassword, confirmNewPassword }, { intl }) {
  const errors = {}
  if (newPassword) {
    if (!isPasswordAcceptable(newPassword)) {
      errors.newPassword = intl.formatMessage(passwordComplexityMessages.requirements)
    }
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = intl.formatMessage(messages.passwordsDoNotMatch)
    }
  } else {
    errors.newPassword = intl.formatMessage(messages.newPasswordRequired)
  }
  return errors
}

const ResetPasswordEnterPassword = ({ intl, action, onSubmit }) => {
  const { values, errors, touched, dirty, isValid, isSubmitting, handleBlur, handleChange, handleSubmit } = useFormik({
    initialValues: INITIAL_VALUES,
    validate: formValues => validate(formValues, { intl }),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className={styles.Form}>
      <div className={styles.Form__Content}>
        <p className={styles.Form__Intro}>{intl.formatMessage(messages.enterNewPasswordContent)}</p>
        <StrongPasswordInput
          intl={intl}
          input={{
            value: values.newPassword,
            onChange: handleChange,
          }}
          meta={{ touched: !!touched.newPassword, error: errors.newPassword }}
          textFieldProps={{
            floatingLabelText: intl.formatMessage(messages.newPassword),
            type: 'password',
            name: 'newPassword',
            maxLength: 100,
            autoFocus: true,
            fullWidth: true,
          }}
          popOverProps={{}}
        />
        <TextField
          fullWidth
          type="password"
          name="confirmNewPassword"
          label={intl.formatMessage(messages.confirmNewPassword)}
          value={values.confirmNewPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={!!touched.confirmNewPassword && !!errors.confirmNewPassword}
          helperText={touched.confirmNewPassword && errors.confirmNewPassword}
          inputProps={{ maxLength: 100 }}
        />
      </div>
      <div className={styles.Form__ActionRow}>
        {action}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!dirty || !isValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : null}
        >
          {intl.formatMessage(messages.next)}
        </Button>
      </div>
    </form>
  )
}

ResetPasswordEnterPassword.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  action: PropTypes.node,
  onSubmit: PropTypes.func.isRequired,
}

ResetPasswordEnterPassword.defaultProps = {
  action: null,
}

export default ResetPasswordEnterPassword
