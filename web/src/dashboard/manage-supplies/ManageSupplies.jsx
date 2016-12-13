// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl
} from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import { Unit } from '../../components/pureGrids'
import styles from './ManageSupplies.css'

export class ManageSupplies extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle('ManageSupplies')
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="ManageSupplies" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div>
          <Unit sm="1-2" md="1-3" lg="1-4">
          </Unit>
        </div>
      </div>
    )
  }
}

export const ManageSuppliesContainer = _.flowRight(
  injectIntl
)(ManageSupplies)

