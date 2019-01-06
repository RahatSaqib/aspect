import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withStateHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { defineMessages } from 'react-intl'
import { Link } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import Card from '@material-ui/core/Card'

import { Unit } from '../../components/pureGrids'
import recomposeForm from '../../components/recomposeForm'
import { loginStart } from '../AuthRedux'
import Reason from './Reason'
import { reasonTypes } from '../loggedOutReasons'

const cssClasses = classnames.bind(require('./Login.css'))

const messages = defineMessages({
  title: {
    id: 'pages.Login.title',
    defaultMessage: 'Login',
  },
  user: {
    id: 'pages.Login.user',
    defaultMessage: 'Username',
  },
  password: {
    id: 'pages.Login.password',
    defaultMessage: 'Password',
  },
  login: {
    id: 'pages.Login.login',
    defaultMessage: 'Login',
  },
  resetPasswordLink: {
    id: 'pages.Login.resetPasswordLink',
    defaultMessage: 'Forgot Password?',
  },
})

const enhance = compose(
  connect(
    state => ({
      loggedOutReason: state.user.loggedOutReason,
    }),
    bindActionCreators.bind(null, {
      loginStart,
    })
  ),
  withStateHandlers(
    {
      values: {
        user: '',
        password: '',
      },
    },
    {
      onSubmit: (
        state,
        { history, location, loginStart, loggedOutReason }
      ) => data => {
        loginStart(data).then(() => {
          const referrer = _.flowRight(
            x => _.omit(x, 'search'),
            x =>
              _.get(x, 'state.referrer', {
                pathname: '/',
              })
          )(location)
          if (loggedOutReason === reasonTypes.idle) {
            history.replace(referrer)
          } else if (loggedOutReason === reasonTypes.userRequested) {
            history.replace('/')
          } else {
            history.push(referrer)
          }
        })
      },

      onChange: () => nextValues => ({ values: nextValues }),

      onUsernameMount: () => ref => {
        if (ref) {
          ref.focus()
        }
      },
    }
  ),
  recomposeForm({
    fields: [
      {
        fieldName: 'user',
        valueFromChangeEvent: it => it.target.value,
      },
      {
        fieldName: 'password',
        valueFromChangeEvent: it => it.target.value,
      },
    ],
    validate(values) {
      const errors = {}
      if (values) {
        if (!values.user) {
          errors.user = 'Please enter your username'
        }
        if (!values.password) {
          errors.password = 'Please enter your password'
        }
      }
      return errors
    },
  })
)

const AspectLogo = () => (
  <img
    className={cssClasses('Logo__Image')}
    src={require('./logo_aspect.png')}
    alt="Aspect"
  />
)

export const Login = ({
  intl,
  location,
  onUsernameMount,
  form,
  meta,
  values,
  onUserChange,
  onPasswordChange,
  handleSubmit,
}) => (
  <div className={cssClasses('Background')}>
    <Helmet title="Login" />
    <div>
      <Unit sm="1-24" md="1-6" lg="1-3" xl="1-3" />
      <Unit sm="11-12" md="2-3" lg="1-3" xl="1-3">
        <Card>
          <div className={cssClasses('Logo__Container')}>
            <AspectLogo />
          </div>
          <form onSubmit={handleSubmit} className={cssClasses('Form')}>
            <Reason
              intl={intl}
              location={location}
              className={cssClasses('Form__Info')}
            />
            <TextField
              inputRef={onUsernameMount}
              autoFocus
              fullWidth
              name="user"
              label={intl.formatMessage(messages.user)}
              value={values.user}
              onChange={onUserChange}
              error={meta.user.touched && meta.user.error}
              helperText={meta.user.touched && meta.user.error}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <TextField
              autoFocus
              fullWidth
              type="password"
              name="password"
              label={intl.formatMessage(messages.password)}
              value={values.password}
              onChange={onPasswordChange}
              error={meta.password.touched && meta.password.error}
              helperText={meta.password.touched && meta.password.error}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
            <div className={cssClasses('Form__ActionRow')}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={cssClasses('Button')}
                disabled={!form.valid}
              >
                {intl.formatMessage(messages.login)}
              </Button>
              <Link className={cssClasses('Right_Align')} to="reset-password">
                {intl.formatMessage(messages.resetPasswordLink)}
              </Link>
            </div>
          </form>
          {form.submitting && (
            <LinearProgress className={cssClasses('Progress')} />
          )}
        </Card>
      </Unit>
    </div>
  </div>
)

export default enhance(Login)
