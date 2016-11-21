// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import { Unit } from '../../components/pureGrids'
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
        <div>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <Link to="device">
              <MiniChart
                data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
                label={'Out of service'} number={45} bgcolor={'#607d8b'}
              />
            </Link>
          </Unit>
        </div>
      </div>
    )
  }
}

export const MaintenanceContainer = _.flowRight(
  injectIntl
)(Maintenance)
