// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import MiniChart from '../../components/shared/MiniChart'
import styles from './Maintenance.css'

export class Maintenance extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle('Maintenance')
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Maintenance" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="device">
              <MiniChart
                data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
                label={'Out of service'} number={45} bgcolor={'#607d8b'}
              />
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export const MaintenanceContainer = _.flowRight(
  injectIntl
)(Maintenance)
