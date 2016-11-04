// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form/immutable'
import Helmet from 'react-helmet'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import {Link} from 'react-router'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'

// Our own imports
import TextInput from '../../components/shared/TextInput'
import { ErrorDisplayContainer } from '../../components/shared/ErrorDisplay'
import { loginStart } from '../AuthRedux'
import styles from './Login.css'

const messages = defineMessages({
  title: {
    id: 'pages.Login.title',
    defaultMessage: 'Login'
  },
  reasonidle: {
    id: 'shared.Login.reasonIdle',
    defaultMessage: 'You were logged out due to inactivity'
  },
  resetPasswordLink: {
    id: 'shared.Login.resetPasswordButton',
    defaultMessage: 'Forgot Password?'
  }
})

class Login extends PureComponent {

  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired
  }

  render() {
    const { intl, handleSubmit, pristine, submitting, location, initialValues } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Background}>
        <Helmet title="Login" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div className="pure-g">
            <div className="pure-u-lg-1-3 pure-u-md-1-6 pure-u-sm-1-24">
              &nbsp;
            </div>
            <div className="pure-u-lg-1-3 pure-u-md-2-3 pure-u-sm-11-12">
              <Paper>
                <form onSubmit={handleSubmit} className={styles.Form}>
                  { location.query.reason ? <div className={styles.Form__Info}>{formatMessage(messages['reason' +location.query.reason])}</div> : null }
                  <TextInput name="user" label="Username" fullWidth autoFocus={_.isEmpty(initialValues.get('user'))} />
                  <TextInput name="password" type="password" label="Password" fullWidth autoFocus={!_.isEmpty(initialValues.get('user'))} />
                  <div className={styles.Form__ActionRow}>
                    <Link className={styles.Left_Align} to="reset-password">
                      {formatMessage(messages.resetPasswordLink)}
                    </Link>
                    <RaisedButton disabled={pristine || submitting} label="Log In" secondary type="submit" />
                  </div>
                </form>
                {submitting && <LinearProgress />}
              </Paper>
            </div>
          </div>
        </div>
        <ErrorDisplayContainer />
      </div>
    )
  }
}

function mapStateToProps({user: { name }}) {
  return {
    initialValues: {user: name}
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSubmit: loginStart
  }, dispatch)
}

function validate(values) {
  const errors = {}

  if (!values.get('user')) {
    errors.user = 'Please enter your username'
  }
  if (!values.get('password')) {
    errors.password = 'Please enter your password'
  }

  return errors
}

export const LoginContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'login',
    validate
  })
)(Login)
