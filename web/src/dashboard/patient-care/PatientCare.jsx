import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

import Paper from 'material-ui/Paper'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import styles from './PatientCare.css'

const messages = defineMessages({
  filterTemplate: {
    id: 'pages.PatientCare.filterTemplate',
    defaultMessage:
      'Viewing <ASSAY> results <DATE><RESULT> from all sites<GEOGRAPHY><NAME>',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    () => ({}),
    dispatch =>
      bindActionCreators(
        {
          configureListFilter,
        },
        dispatch
      )
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
    const { location, intl } = this.props
    const { formatMessage } = intl
    const search = new URLSearchParams(location.search)

    return (
      <div className={styles.Content}>
        <Helmet
          title="Patient Care"
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title="Patient Care" />
        <ListFilterContainer
          subject={search.get('type') === 'TB' ? 'TB' : 'HCV'}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
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
