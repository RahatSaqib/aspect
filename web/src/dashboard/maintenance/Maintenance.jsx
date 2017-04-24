import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

// Our own imports
import { Unit } from '../../components/pureGrids'
import MiniChart from '../../components/shared/MiniChart'
import NavTitle from '../../globals/components/NavTitle'
import styles from './Maintenance.css'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
)

export const Maintenance = () => (
  <div className={styles.Content}>
    <Helmet title="Maintenance" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
    <NavTitle title="Maintenance" />
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

export default enhance(Maintenance)
