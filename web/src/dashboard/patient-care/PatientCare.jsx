// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router'

import Paper from 'material-ui/Paper'

// Our own imports
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import styles from './PatientCare.css'

const messages = defineMessages({
  filterTemplate: {
    id: 'pages.PatientCare.filterTemplate',
    defaultMessage: 'Viewing <ASSAY> results <DATE><RESULT> from all sites<GEOGRAPHY><NAME>'
  }
})

export class PatientCare extends PureComponent {

  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        type: PropTypes.string
      })
    }).isRequired,
    intl: intlShape.isRequired,
    setPageTitle: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter } = this.props
    setPageTitle('Patient Care')
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      siteName: true })
  }

  render() {
    const { intl: { formatMessage } } = this.props
    return (
      <div className={styles.Content}>
        <Helmet title="Patient Care" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={this.props.location.query.type === 'TB' ? 'TB' : 'HCV'}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
        <Paper>
          <Link to="/result">
            <img
              alt="disease graph"
              src={
                this.props.location.query.type === 'TB' ?
                require('./TB.png') :
                require('./HCV.png')
              }
              style={{ display: 'block', width: '100%' }}
            />
          </Link>
        </Paper>
      </div>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter
  }, dispatch)
}

export const PatientCareContainer = _.flowRight(
  injectIntl,
  connect(null, mapDispatchToProps)
)(PatientCare)

