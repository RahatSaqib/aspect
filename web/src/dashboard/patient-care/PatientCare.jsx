import PropTypes from 'prop-types'
import React from 'react'
import { compose, withProps, setPropTypes, pure } from 'recompose'
import { injectIntl, intlShape } from 'react-intl'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

import Paper from 'material-ui/Paper'
import { Card, CardHeader } from 'material-ui/Card'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import styles from './PatientCare.css'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  withProps(({ location }) => ({
    searchParams: new URLSearchParams(location.search),
  })),
  injectIntl,
  setPropTypes({
    intl: intlShape.isRequired,
  })
)

export const PatientCare = ({ searchParams }) =>
  <div className={styles.Content}>
    <Helmet
      title="Patient Care"
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title="Patient Care" />
    <Card>
      <CardHeader
        subtitle={`No filters set - showing all ${searchParams.get('type') ===
        'TB'
          ? 'TB'
          : 'HCV'}`}
      />
    </Card>
    <Paper>
      <Link to="/result">
        <img
          alt="disease graph"
          src={
            searchParams.get('type') === 'TB'
              ? require('./TB.png')
              : require('./HCV.png')
          }
          style={{ display: 'block', width: '100%' }}
        />
      </Link>
    </Paper>
  </div>

export default enhance(PatientCare)
