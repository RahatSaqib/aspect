// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { DataTable } from '../../components/shared/DataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredReports } from '../ReportRedux'
import styles from './ReportList.css'

const messages = defineMessages({
  title: {
    id: 'pages.ReportList.title',
    defaultMessage: 'Reports'
  },
  deploymentName: {
    id: 'pages.ReportList.deploymentName',
    defaultMessage: 'Deployment Name'
  },
  moduleSerial: {
    id: 'pages.ReportList.moduleSerial',
    defaultMessage: 'Module Serial'
  },
  dateOfError: {
    id: 'pages.ReportList.dateOfError',
    defaultMessage: 'Date of Error'
  },
  error: {
    id: 'pages.ReportList.error',
    defaultMessage: 'Error'
  },
  totalTestsRun: {
    id: 'pages.ReportList.totalTestsRun',
    defaultMessage: 'Total Tests Run'
  },
  totalErrors: {
    id: 'pages.ReportList.totalErrors',
    defaultMessage: 'Total Errors'
  }
})

export class ReportList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    fetchListFilteredReports: PropTypes.func.isRequired,
    configureListFilter: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    listFilter: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
    configureListFilter({ contactNameOrEmail: true })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredReports({}, ...args)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer />
        <DataTable
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={[
            { db: 'deploymentName', title: formatMessage(messages.deploymentName) },
            { db: 'moduleSerial', title: formatMessage(messages.moduleSerial) },
            { db: 'dateOfError', title: formatMessage(messages.dateOfError) },
            { db: 'error', title: formatMessage(messages.error) },
            { db: 'totalTestsRun', title: formatMessage(messages.totalTestsRun) },
            { db: 'totalErrors', title: formatMessage(messages.totalErrors) }
          ]}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.report.items,
    table: state.report.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredReports
  }, dispatch)
}

export const ReportListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ReportList)
