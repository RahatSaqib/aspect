import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, withProps, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form/immutable'
import Helmet from 'react-helmet'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { Link } from 'react-router-dom'
import { Button } from 'react-toolbox/lib/button'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

// Our own imports
import { Unit } from '../../components/pureGrids'
import TextInput from '../../components/shared/TextInput'
import AppNotificationSnackBar from '../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../appNotification/AppNotificationDialog'
import { ContactDetails } from '../../person/PersonRedux'
import { loginStart } from '../AuthRedux'

const messages = defineMessages({
  title: {
    id: 'pages.Login.title',
    defaultMessage: 'Login',
  },
  reasonIdle: {
    id: 'shared.Login.reasonIdle',
    defaultMessage: 'You were logged out due to inactivity',
  },
  resetPasswordLink: {
    id: 'shared.Login.resetPasswordButton',
    defaultMessage: 'Forgot Password?',
  },
})

const cssClasses = classnames.bind(require('./Login.css'))

const LinearProgress = <ProgressBar type="linear" />
const AspectLogo = () =>
  <img
    className={cssClasses('Logo__Image')}
    src={require('../../globals/layouts/logo-aspect.png')}
    alt="Aspect"
  />

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  withProps(({ location }) => ({
    searchParams: new URLSearchParams(location.search),
  })),
  connect(
    state => ({
      initialValues: {
        user: state.user.name,
      },
    }),
    dispatch =>
      bindActionCreators(
        {
          onSubmit: loginStart,
        },
        dispatch
      )
  ),
  reduxForm({
    form: 'login',
    validate(values) {
      const errors = {}
      if (values) {
        if (!values.get('user')) {
          errors.user = 'Please enter your username'
        }
        if (!values.get('password')) {
          errors.password = 'Please enter your password'
        }
      }
      return errors
    },
  }),
  setPropTypes({
    intl: intlShape.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    initialValues: PropTypes.objectOf(ContactDetails).isRequired,
  })
)

export const Login = ({
  intl,
  searchParams,
  handleSubmit,
  submitting,
  initialValues,
}) =>
  <div className={cssClasses('Background')}>
    <Helmet title="Login" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
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
            <TextInput
              theme={{
                label: cssClasses('Form__Input'),
              }}
              name="user"
              label="Username"
              fullWidth
              autoFocus={_.isEmpty(initialValues.get('user'))}
            />
            <TextInput
              theme={{
                label: cssClasses('Form--input'),
              }}
              name="password"
              type="password"
              label="Password"
              fullWidth
              autoFocus={!_.isEmpty(initialValues.get('user'))}
            />
            <div className={cssClasses('Form__ActionRow')}>
              <Button
                className={cssClasses('Button')}
                label="LogIn"
                type="submit"
                raised
                primary
              />
              <Link className={cssClasses('Right_Align')} to="reset-password">
                {intl.formatMessage(messages.resetPasswordLink)}
              </Link>
            </div>
          </form>
          {submitting && <LinearProgress />}
        </Card>
      </Unit>
    </div>
    <AppNotificationDialog />
    <AppNotificationSnackBar />
  </div>

export default enhance(Login)
