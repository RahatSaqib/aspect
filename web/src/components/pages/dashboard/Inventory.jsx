// Imports from packages
import React from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

// Our own imports
import MiniChart from '../../shared/MiniChart'

export class Inventory extends React.PureComponent {
  render() {
    return (
      <div className="content">
        <Helmet title="Inventory" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="device">
              <MiniChart  data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                        label={"Cartridges"} number={1456} bgcolor={'#FBC02D'} culture="en-US" />
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export default Inventory
