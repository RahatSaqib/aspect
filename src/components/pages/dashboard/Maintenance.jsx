// Imports from packages
import React from 'react'
import { Link } from 'react-router'
import PureRenderMixin from 'react-addons-pure-render-mixin'

// Our own imports
import MiniChart from '../../shared/MiniChart'

export class Maintenance extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <div className="content">
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="device">
              <MiniChart  data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
                        label={"Out of service"} number={45} bgcolor={'#607d8b'} culture="en-US" />
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export default Maintenance
