import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import Paper from 'material-ui/Paper'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import Arrow from 'material-ui/svg-icons/navigation/arrow-forward'
import TextField from 'material-ui/TextField'

class Login extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = {  user: '',
                    password: '',
                    error_user: '',
                    error_password: ''}
  }

  componentDidMount = () => { setTimeout(() => { this.refs.user.focus() }, 500) }

  handleSubmit = (e) => {

    e.preventDefault()

    this.setState({ error_user: this.state.user ? '' : 'Please enter your username' })
    this.setState({ error_password: this.state.password ? '' : 'Please enter your password' })

    if (!this.state.user || !this.state.password){
      return
    }

    // TODO: GET the JWT here and store as a cookie. For now, put any username in local storage:
    window.sessionStorage.accessToken = this.state.user


    this.context.router.push({ pathName: '/', query: { fl: '1' } })
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
    return (
      <div style={{height: '100%'}}>
        <div style={{backgroundColor: '#4CAF50', height: '50%'}}>
          &nbsp;
        </div>
        <Paper style={{ width: '400px', height: '180px', padding: '10px 20px', margin: 'auto', marginTop: '-90px'}} zDepth={1} >
            <form onSubmit={this.handleSubmit}>
              <div style={{width: '85%', float: 'left'}}>
                <TextField ref="user" errorStyle={{ float: 'left' }} value={this.state.user} floatingLabelText="Username" errorText={this.state.error_user} onChange={this.handleUserChange} />
                <TextField ref="password" errorStyle={{ float: 'left' }} value={this.state.password} onChange={this.handlePasswordChange} floatingLabelText="Password" type="password" errorText={this.state.error_password} />
              </div>
            <div style={{ float: 'left', width: '15%'}}>
              <FloatingActionButton type="submit" secondary={true} style={{ position: 'relative', top: '50px', right: '-45px' }}>
                <Arrow />
              </FloatingActionButton>
            </div>
            </form>
        </Paper>
      </div>
    )
  }
}

Login.contextTypes =  {
  router: React.PropTypes.object.isRequired
}

export default Login
