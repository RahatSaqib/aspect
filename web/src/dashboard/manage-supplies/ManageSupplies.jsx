import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import Helmet from 'react-helmet'

// Our own imports
import DashboardInventory from '../dashboard/DashboardInventory'
import { Unit } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import styles from './ManageSupplies.css'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure
)

export const ManageSupplies = () =>
  <div className={styles.Content}>
    <Helmet
      title="Manage Supplies"
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title="Manage Supplies" />
    <div>
      <Unit sm="1-2" md="1-3" lg="1-4">
        <DashboardInventory label={'Cartridges'} />
      </Unit>
    </div>
  </div>

export default enhance(ManageSupplies)
