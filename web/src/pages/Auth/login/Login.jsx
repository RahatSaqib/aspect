import React from 'react'
import { Box, Button, Card, LinearProgress, TextField } from '@mui/material'
import { useFormik } from 'formik'
import flowRight from 'lodash/flowRight'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { loginStart } from '../../../store/AuthRedux'
import { reasonTypes } from '../loggedOutReasons'
import styles from './Login.module.css'
import messages from './messages'
import Reason from './Reason'

const errorProps = ({ touched, error } = {}) =>
  touched && error
    ? {
        error: true,
        helperText: error,
      }
    : {}

const AspectLogo = () => (
  <img className={styles.Logo__Image} src={require('../../../assets/logo_aspect.png')} alt="Aspect" />
)

export const Login = ({ intl, location, form, meta, values, onUserChange, onPasswordChange, handleSubmit }) => (
  <div className={styles.Background}>
    <Helmet title={intl.formatMessage(messages.title)} />
    <div>
      <Box sx={{ margin: '0 auto', width: { sm: '90%', md: '66%', lg: '33%' } }}>
        <Card>
          <div className={styles.Logo__Container}>
            <AspectLogo />
          </div>
          <form onSubmit={handleSubmit} className={styles.Form}>
            <Reason intl={intl} location={location} className={styles.Form__Info} />
            <TextField
              autoFocus
              fullWidth
              name="user"
              label={intl.formatMessage(messages.user)}
              value={values.user}
              onChange={onUserChange}
              {...errorProps(meta.user)}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <TextField
              fullWidth
              type="password"
              name="password"
              label={intl.formatMessage(messages.password)}
              value={values.password}
              onChange={onPasswordChange}
              {...errorProps(meta.password)}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <div className={styles.Form__ActionRow}>
              <Button
                type="submit"
                variant="contained"
                data-test="loginSubmit"
                color="primary"
                className={styles.Button}
                disabled={!form.valid || form.submitting}
              >
                {intl.formatMessage(messages.login)}
              </Button>
              <Link className={styles.Right_Align} to="/reset-password">
                {intl.formatMessage(messages.resetPasswordLink)}
              </Link>
            </div>
          </form>
          {form.submitting && <LinearProgress className={styles.Progress} />}
        </Card>
      </Box>
    </div>
  </div>
)

const LoginContainer = ({ intl, location, loggedOutReason, loginStart }) => {
  const navigate = useNavigate()
  const currentLocation = useLocation()

  const { values, errors, touched, isValid, isSubmitting, setFieldValue, setFieldTouched, handleSubmit } = useFormik({
    initialValues: {
      user: '',
      password: '',
    },
    validate: values => {
      const errors = {}
      if (!values.user) {
        errors.user = intl.formatMessage(messages.usernameRequired)
      }
      if (!values.password) {
        errors.password = intl.formatMessage(messages.passwordRequired)
      }
      return errors
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await loginStart(values)
        const referrer = flowRight(
          x => omit(x, 'search'),
          x => get(x, 'state.referrer', { pathname: '/' })
        )(currentLocation)
        navigate(loggedOutReason === reasonTypes.userRequested ? '/' : referrer, { replace: true })
      } finally {
        setSubmitting(false)
      }
    },
  })

  const onFieldChange = fieldName => event => {
    setFieldTouched(fieldName, true, false)
    setFieldValue(fieldName, event.target.value)
  }

  return (
    <Login
      intl={intl}
      location={location}
      values={values}
      meta={{
        user: { touched: touched.user, error: errors.user },
        password: { touched: touched.password, error: errors.password },
      }}
      form={{ valid: isValid, submitting: isSubmitting }}
      onUserChange={onFieldChange('user')}
      onPasswordChange={onFieldChange('password')}
      handleSubmit={handleSubmit}
    />
  )
}

export default flowRight(
  injectIntl,
  connect(
    state => ({
      loggedOutReason: state.user.loggedOutReason,
    }),
    {
      loginStart,
    }
  )
)(LoginContainer)
