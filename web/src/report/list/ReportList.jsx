// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredReports } from '../ReportRedux'
import styles from './ReportList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'


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
  },
  filterTemplate: {
    id: 'pages.ReportList.filterTemplate',
    defaultMessage: 'Viewing all reports<NAME>.'
  }
})

export class ReportList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredReports: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
    configureListFilter({ contactNameOrEmail: true })
  }

  componentDidMount() {
    this.handleFetch()
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
    const columns = [
      { db: 'deploymentName', title: formatMessage(messages.deploymentName) },
      { db: 'moduleSerial', title: formatMessage(messages.moduleSerial) },
      { db: 'dateOfError', title: formatMessage(messages.dateOfError) },
      { db: 'error', title: formatMessage(messages.error) },
      { db: 'totalTestsRun', title: formatMessage(messages.totalTestsRun) },
      { db: 'totalErrors', title: formatMessage(messages.totalErrors) }
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
        <DataTableWithEmptyList
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
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
