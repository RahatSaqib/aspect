import React, { useState } from 'react'
import { Box, Button, Card, LinearProgress, TextField } from '@mui/material'
import flowRight from 'lodash/flowRight'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { compose } from 'recompose'
import recomposeForm, { errorProps } from '../../../components/recomposeForm'
import { loginStart } from '../../../store/AuthRedux'
import { reasonTypes } from '../loggedOutReasons'
import styles from './Login.module.css'
import messages from './messages'
import Reason from './Reason'

const enhance = compose(
  injectIntl,
  connect(
    state => ({
      loggedOutReason: state.user.loggedOutReason,
    }),
    {
      loginStart,
    }
  ),
  WrappedComponent => props => {
    const navigate = useNavigate()
    const location = useLocation()
    const [state, setState] = useState({
      values: {
        user: '',
        password: '',
      },
    })

    const onSubmit = data => {
      const { loginStart, loggedOutReason } = props
      return loginStart(data).then(() => {
        const referrer = flowRight(
          x => omit(x, 'search'),
          x => get(x, 'state.referrer', { pathname: '/' })
        )(location)
        if (loggedOutReason === reasonTypes.userRequested) {
          navigate('/', { replace: true })
        } else {
          navigate(referrer, { replace: true })
        }
      })
    }

    const onChange = nextValues => {
      setState({ values: nextValues })
    }

    return <WrappedComponent {...props} {...state} onSubmit={onSubmit} onChange={onChange} />
  },
  recomposeForm({
    fields: [
      { fieldName: 'user', valueFromChangeEvent: it => it.target.value },
      { fieldName: 'password', valueFromChangeEvent: it => it.target.value },
    ],
    validate(values, { intl }) {
      const errors = {}
      if (values) {
        if (!values.user) {
          errors.user = intl.formatMessage(messages.usernameRequired)
        }
        if (!values.password) {
          errors.password = intl.formatMessage(messages.passwordRequired)
        }
      }
      return errors
    },
  })
)

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

export default enhance(Login)
