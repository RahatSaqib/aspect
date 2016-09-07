// Imports from packages
import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form/immutable'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

// Our own imports
import { loginStart } from '../../../action_creators/user_creators'
import { ErrorDisplayContainer } from '../../shared/ErrorDisplay'

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

class Login extends React.PureComponent {

  static propTypes = {
    handleSubmit: React.PropTypes.func.isRequired,
    pristine: React.PropTypes.bool.isRequired,
    submitting: React.PropTypes.bool.isRequired
  }

  render() {
    const { handleSubmit, pristine, submitting } = this.props

    return (
      <div className="login-background">
        <div className="content">
          <div className="pure-g">
            <div className="pure-u-lg-1-3 pure-u-md-1-6 pure-u-sm-1-24">
              &nbsp;
            </div>
            <div className="pure-u-lg-1-3 pure-u-md-2-3 pure-u-sm-11-12">
              <Paper>
                <form onSubmit={handleSubmit} className={'login-form'}>
                  <Field name="user" component={renderUserField} />
                  <br/>
                  <Field name="password" component={renderPasswordField} />
                  <br/>
                  <div className="button-row">
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

function mapStateToProps(state) {
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
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'login',
    validate
  })
)(Login)
