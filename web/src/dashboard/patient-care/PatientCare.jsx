import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

import Paper from 'material-ui/Paper'
import { Card, CardHeader } from 'material-ui/Card'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import { configureListFilter } from '../../filter/FilterRedux'
import styles from './PatientCare.css'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    null,
    bindActionCreators.bind(null, {
      configureListFilter,
    })
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  })
)

export class PatientCare extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      siteName: true,
    })
  }

  render() {
    const { location } = this.props
    const search = new URLSearchParams(location.search)

    return (
      <div className={styles.Content}>
        <Helmet
          title="Patient Care"
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title="Patient Care" />
        <Card>
          <CardHeader
            subtitle={`No filters set - showing all ${search.get('type') ===
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
                search.get('type') === 'TB'
                  ? require('./TB.png')
                  : require('./HCV.png')
              }
              style={{ display: 'block', width: '100%' }}
            />
          </Link>
        </Paper>
      </div>
    )
  }
}

export default enhance(PatientCare)
