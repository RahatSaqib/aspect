// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredResults } from '../ResultRedux'
import styles from './ResultList.css'

const messages = defineMessages({
  title: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results'
  },
  endedOn: {
    id: 'pages.ResultList.EndedOn',
    defaultMessage: 'Test Date'
  },
  deviceName: {
    id: 'pages.ResultList.deviceName',
    defaultMessage: 'Device'
  },
  sampleId: {
    id: 'pages.ResultList.sampleId',
    defaultMessage: 'Sample ID'
  },
  assayId: {
    id: 'pages.ResultList.assayId',
    defaultMessage: 'Assay'
  },
  patiendId: {
    id: 'pages.ResultList.patiendId',
    defaultMessage: 'Patient ID'
  },
  resultCategoryCopiesMl: {
    id: 'pages.ResultList.resultCategoryHiv',
    defaultMessage: 'HIV'
  },
  filterTemplate: {
    id: 'pages.ResultList.filterTemplate',
    defaultMessage: 'Viewing <SAMPLE_ID><ASSAY> results <DATE><RESULT> from all sites<GEOGRAPHY><NAME> <WORKFLOWSTATUS>'
  }
})

export class ResultList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    listFilter: PropTypes.object.isRequired,
    fetchListFilteredResults: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      sampleId: true,
      siteName: true,
      sampleOriginSiteName: true,
      workflowStatus: true })
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
    this.props.fetchListFilteredResults({}, ...args)
  }

  handleItemIdSelection = (resultId) => {
    this.props.router.push(`/result/${resultId}`)
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatDate } = intl
    const columns = [
      { db: 'endedOn', title: formatMessage(messages.endedOn), format: data => formatDate(data) },
      { db: 'deviceName', title: formatMessage(messages.deviceName) },
      { db: 'sampleId', title: formatMessage(messages.sampleId) },
      { db: 'patientId', title: formatMessage(messages.patiendId) }
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
        <DataTableWithEmptyList
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
          messages={messages}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.result.items,
    table: state.result.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredResults
  }, dispatch)
}

export const ResultListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultList)
