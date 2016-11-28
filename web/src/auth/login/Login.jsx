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
import { Link } from 'react-router'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'

// Our own imports
import { Unit } from '../../components/pureGrids'
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

export class Login extends PureComponent {

  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired,
    intl: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    initialValues: PropTypes.object.isRequired
  }

  render() {
    const { intl, handleSubmit, pristine, submitting, location, initialValues } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Background}>
        <Helmet title="Login" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={styles.Content}>
          <div>
            <Unit sm="1-24" md="1-6" lg="1-3">
              &nbsp;
            </Unit>
            <Unit sm="11-12" md="2-3" lg="1-3">
              <Paper>
                <form onSubmit={handleSubmit} className={styles.Form}>
                  { location.query.reason ? <div className={styles.Form__Info}>{formatMessage(messages[`reason${location.query.reason}`])}</div> : null }
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
            </Unit>
          </div>
        </div>
        <ErrorDisplayContainer />
      </div>
    )
  }
}

function mapStateToProps({ user: { name } }) {
  return {
    initialValues: { user: name }
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSubmit: loginStart
  }, dispatch)
}

function validate(values) {
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
}

export const LoginContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'login',
    validate
  })
)(Login)
