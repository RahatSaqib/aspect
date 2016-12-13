// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import { Unit } from '../../components/pureGrids'
import styles from './ManageDevices.css'

export class ManageDevices extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle('ManageDevices')
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="ManageDevices" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div>
          <Unit sm="1-2" md="1-3" lg="1-4">
          </Unit>
        </div>
      </div>
    )
  }
}

export const ManageDevicesContainer = _.flowRight(
  injectIntl
)(ManageDevices)

