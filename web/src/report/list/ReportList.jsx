import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredReports } from '../ReportRedux'

const cssClasses = classnames.bind(require('./ReportList.css'))

const messages = defineMessages({
  title: {
    id: 'pages.ReportList.title',
    defaultMessage: 'Reports',
  },
  deploymentName: {
    id: 'pages.ReportList.deploymentName',
    defaultMessage: 'Deployment Name',
  },
  moduleSerial: {
    id: 'pages.ReportList.moduleSerial',
    defaultMessage: 'Module Serial',
  },
  dateOfError: {
    id: 'pages.ReportList.dateOfError',
    defaultMessage: 'Date of Error',
  },
  error: {
    id: 'pages.ReportList.error',
    defaultMessage: 'Error',
  },
  totalTestsRun: {
    id: 'pages.ReportList.totalTestsRun',
    defaultMessage: 'Total Tests Run',
  },
  totalErrors: {
    id: 'pages.ReportList.totalErrors',
    defaultMessage: 'Total Errors',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.report.items,
      table: state.report.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredReports,
      configureListFilter,
    })
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredReports: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  })
)

export class ReportList extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
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
      { db: 'totalErrors', title: formatMessage(messages.totalErrors) },
    ]

    return (
      <div className={cssClasses('Content')}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />
        <BrowseFilters
          history={this.props.history}
          location={this.props.location}
          intl={intl}
        />
        <DataTableWithEmptyList
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
        />
      </div>
    )
  }
}

export default enhance(ReportList)
