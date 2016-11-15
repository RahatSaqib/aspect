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
import styles from './Inventory.css'

export class Inventory extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle('Inventory')
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Inventory" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <Link to="device">
              <MiniChart
                data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                label={'Cartridges'} number={1456} bgcolor={'#FBC02D'}
              />
            </Link>
          </Unit>
        </div>
      </div>
    )
  }
}

export const InventoryContainer = _.flowRight(
  injectIntl
)(Inventory)

