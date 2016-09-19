// Imports from packages
import React from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

// Our own imports
import MiniChart from '../../shared/MiniChart'

export class Maintenance extends React.PureComponent {
  render() {
    return (
      <div className="content">
        <Helmet title="Maintenance" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
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
