import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withState } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { defineMessages } from 'react-intl'
import { Link } from 'react-router-dom'
import { Button } from 'react-toolbox/lib/button'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'
import { Input } from 'react-toolbox/lib/input'

import { Unit } from '../../components/pureGrids'
import recomposeForm from '../../components/recomposeForm'
import { loginStart } from '../AuthRedux'

const cssClasses = classnames.bind(require('./Login.css'))

const messages = defineMessages({
  title: {
    id: 'pages.Login.title',
    defaultMessage: 'Login',
  },
  reasonIdle: {
    id: 'pages.Login.reasonIdle',
    defaultMessage: 'You were logged out due to inactivity',
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
  withProps(({ location }) => ({
    searchParams: new URLSearchParams(location.search),
  })),
  connect(
    null,
    bindActionCreators.bind(null, {
      onSubmit: loginStart,
    })
  ),
  withState('values', 'onChange', {
    user: '',
    password: '',
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'user',
        valueFromChangeEvent: _.identity,
      },
      {
        fieldName: 'password',
        valueFromChangeEvent: _.identity,
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

const AspectLogo = () =>
  <img
    className={cssClasses('Logo__Image')}
    src={require('./logo_aspect.png')}
    alt="Aspect"
  />

export const Login = ({
  intl,
  searchParams,
  form,
  meta,
  values,
  onUserChange,
  onPasswordChange,
  handleSubmit,
}) =>
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
            {searchParams.has('reason')
              ? <div className={cssClasses('Form__Info')}>
                  {intl.formatMessage(
                    messages[
                      `reason${_.capitalize(searchParams.get('reason'))}`
                    ]
                  )}
                </div>
              : null}
            <Input
              type="text"
              name="user"
              label={intl.formatMessage(messages.user)}
              value={values.user}
              onChange={onUserChange}
              error={meta.user.touched && meta.user.error}
              theme={{
                label: cssClasses('Form__Input'),
              }}
            />
            <Input
              type="password"
              name="password"
              label={intl.formatMessage(messages.password)}
              value={values.password}
              onChange={onPasswordChange}
              error={meta.password.touched && meta.password.error}
              theme={{
                label: cssClasses('Form__Input'),
              }}
            />
            <div className={cssClasses('Form__ActionRow')}>
              <Button
                type="submit"
                className={cssClasses('Button')}
                label={intl.formatMessage(messages.login)}
                disabled={!form.valid}
                raised
                primary
              />
              <Link className={cssClasses('Right_Align')} to="reset-password">
                {intl.formatMessage(messages.resetPasswordLink)}
              </Link>
            </div>
          </form>
          {form.submitting && <ProgressBar type="linear" />}
        </Card>
      </Unit>
    </div>
  </div>

export default enhance(Login)
