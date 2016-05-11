import React from 'react'
import { connect } from 'react-redux'
import Snackbar from 'material-ui/Snackbar'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import MiniChart from './shared/MiniChart'

class Dashboard extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {

    let hasUser = this.props.user && this.props.user.toObject().name !== undefined
    let userName = hasUser ? this.props.user.toObject().name : null

    return (
      <div className="content">
        <h1 className="content-h1">Dashboard</h1>
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <MiniChart  data={[1, 8, 15, 40, 45, 80, 90, 155]}
                        label={"Total Devices"} number={155} bgcolor={'#00bcd4'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <MiniChart  data={[1000, 2000, 4000, 10000, 5000, 50000, 100000, 120000, 110000]}
                        label={"Total Tests"} number={125459} bgcolor={'#8bc34a'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <MiniChart  data={[25, 12, 8, 2, 1]}
                        label={"Error Rate"} number={'12%'} bgcolor={'#ff9800'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <MiniChart  data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                        label={"Cartridges"} number={1456} bgcolor={'#607d8b'} />
          </div>
        </div>
        <Snackbar
            open={this.props.location.search.indexOf('fl') !== -1}
            open={userName != null}
            autoHideDuration={3000}
            message={'Welcome, ' + userName + '!'}  />
      </div>
    )
  }
}

Dashboard.propTypes = {
  user: React.PropTypes.object,
  location: React.PropTypes.object.isRequired
}

function mapStateToProps(state) {
  return {
    user: state.get('user')
  }
}

export default connect(mapStateToProps)(Dashboard)
