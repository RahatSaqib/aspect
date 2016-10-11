// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form/immutable'
import Helmet from 'react-helmet'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

// Our own imports
import { loginStart } from '../../action_creators/user_creators'
import { ErrorDisplayContainer } from '../../components/shared/ErrorDisplay'
import styles from './Login.css'

const messages = defineMessages({
  title: {
    id: 'pages.Login.title',
    defaultMessage: 'Login'
  },
  reasonidle: {
    id: 'shared.Login.reasonIdle',
    defaultMessage: 'You were logged out due to inactivity'
  }
})

const renderUserField = ({ input, meta }) => {
  return (
    <TextField
      floatingLabelText="Username"
      fullWidth={true}
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
      value={input.value}
      onChange={input.onChange}
    />
  )
}

const renderPasswordField = ({ input, meta }) => {
  return (
    <TextField
      type="password"
      floatingLabelText="Password"
      fullWidth={true}
      errorStyle={{ float: 'left' }}
      errorText={meta.touched && meta.error}
      value={input.value}
      onChange={input.onChange}
    />
  )
}

class Login extends PureComponent {

  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    pristine: PropTypes.bool.isRequired,
    submitting: PropTypes.bool.isRequired
  }

  render() {
    const { formatMessage } = this.props.intl
    const { handleSubmit, pristine, submitting, location } = this.props

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
                  <Field name="user" component={renderUserField} />
                  <br/>
                  <Field name="password" component={renderPasswordField} />
                  <br/>
                  <div className={styles.Form__ActionRow}>
                    <RaisedButton disabled={pristine || submitting} label="Log In" secondary={true} type="submit" />
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

function mapStateToProps() {
  return {
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
