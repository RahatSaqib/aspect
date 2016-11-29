// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import DashboardInventory from '../dashboard/DashboardInventory'
import { Unit } from '../../components/pureGrids'
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
            <DashboardInventory label={'Cartridges'} />
          </Unit>
        </div>
      </div>
    )
  }
}

export const InventoryContainer = _.flowRight(
  injectIntl
)(Inventory)

