import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

import { loginStart } from '../action_creators/user_creators'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

class Login extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = {  user: '', password: '', error_user: '', error_password: ''}
  }

  componentDidMount = () => { setTimeout(() => { if (this.refs.user) { this.refs.user.focus() } }, 500) }

  handleSubmit = (e) => {

    e.preventDefault()

    this.setState({ error_user: this.state.user ? '' : 'Please enter your username' })
    this.setState({ error_password: this.state.password ? '' : 'Please enter your password' })

    if (!this.state.user || !this.state.password){
      return
    }

    this.props.loginStart(this.state.user, this.state.password)
  }

  handleUserChange = (e) => {
    this.setState({ user: e.target.value })
    this.setState({ error_user: e.target.value ? '' : 'Please enter your username' })
  }

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value })
    this.setState({ error_password: e.target.value ? '' : 'Please enter your password' })
  }

  render() {

    let progress = this.props.loggingIn ? <LinearProgress /> : ''

    return (
      <div className="login-background">
        <div className="content">
          <div className="pure-g">
            <div className="pure-u-lg-1-3 pure-u-md-1-6 pure-u-sm-1-24">
              &nbsp;
            </div>
            <div className="pure-u-lg-1-3 pure-u-md-2-3 pure-u-sm-11-12">
              <Paper>
                  <form onSubmit={this.handleSubmit} className={'login-form'}>
                    <TextField ref="user" errorStyle={{ float: 'left' }} fullWidth={true} value={this.state.user} floatingLabelText="Username" errorText={this.state.error_user} onChange={this.handleUserChange} />
                    <br/>
                    <TextField ref="password" errorStyle={{ float: 'left' }} fullWidth={true} value={this.state.password} onChange={this.handlePasswordChange} floatingLabelText="Password" type="password" errorText={this.state.error_password} />
                    <br/>
                    <div className="button-row">
                      <RaisedButton label="Log In" secondary={true} type="submit" />
                    </div>
                  </form>
                  {progress}
              </Paper>
            </div>
          </div>
        </div>
        <ErrorDisplayContainer />
      </div>
    )
  }
}

Login.propTypes = {
  loggingIn: React.PropTypes.bool,
  loginStart: React.PropTypes.func.isRequired
}

Login.contextTypes =  {
  router: React.PropTypes.object.isRequired
}

const mapStateToProps = (state) => {
  return {
    loggingIn: state.getIn(['user', 'loggingIn'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ loginStart }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)
