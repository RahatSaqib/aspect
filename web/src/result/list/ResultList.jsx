import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import NavTitle from '../../globals/components/NavTitle'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredResults, exportResults } from '../ResultRedux'
import styles from './ResultList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

const messages = defineMessages({
  title: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results',
  },
  endedOn: {
    id: 'pages.ResultList.EndedOn',
    defaultMessage: 'Test Date',
  },
  deviceName: {
    id: 'pages.ResultList.deviceName',
    defaultMessage: 'Device',
  },
  sampleOriginSiteName: {
    id: 'pages.ResultList.sampleOriginSiteName',
    defaultMessage: 'Sample Origin Site',
  },
  sampleId: {
    id: 'pages.ResultList.sampleId',
    defaultMessage: 'Sample ID',
  },
  sampleGroup: {
    id: 'pages.ResultList.sampleGroup',
    defaultMessage: 'Sample Group',
  },
  assayId: {
    id: 'pages.ResultList.assayId',
    defaultMessage: 'Assay',
  },
  patiendId: {
    id: 'pages.ResultList.patiendId',
    defaultMessage: 'Patient ID',
  },
  resultCategoryCopiesMl: {
    id: 'pages.ResultList.resultCategoryHiv',
    defaultMessage: 'HIV',
  },
  filterTemplate: {
    id: 'pages.ResultList.filterTemplate',
    defaultMessage:
      'Viewing <PATIENT_OR_RESEARCH_ID><SAMPLE_ORIGIN_SITE_ID><SAMPLE_ID><ASSAY> results <DATE><RESULT> from all sites<GEOGRAPHY><NAME> <WORKFLOWSTATUS>',
  },
  nullText: {
    id: 'pages.ResultDetail.nullText',
    defaultMessage: 'N/A',
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
      items: state.result.items,
      table: state.result.table,
    }),
    dispatch =>
      bindActionCreators(
        {
          fetchListFilteredResults,
          configureListFilter,
          exportResults,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredResults: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    exportResults: PropTypes.func.isRequired,
  })
)

export class ResultList extends PureComponent {
  static propTypes = {
    table: PropTypes.objectOf(Table).isRequired,
    configureListFilter: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    fetchListFilteredResults: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired, // eslint-disable-line
    items: PropTypes.objectOf(Items).isRequired,
    exportResults: PropTypes.func.isRequired,
  }

  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      assayAndResultCategory: true,
      geography: true,
      date: true,
      patientOrResearchId: true,
      sampleId: true,
      sampleGroup: true,
      siteName: true,
      sampleOriginSite: true,
      workflowStatus: true,
    })
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

  handleItemIdSelection = resultId => {
    this.props.history.push(`/browse/result/${resultId}`)
  }

  clickResultListExport = (formatType, receivedExportResponse) => {
    this.props.exportResults(
      formatType,
      this.props.table.sortCol,
      this.props.table.sortDir,
      this.props.table.page,
      this.props.table.pageSize,
      receivedExportResponse
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage, formatDate } = intl
    const columns = [
      {
        db: 'endedOn',
        extraProps: { style: { width: '80px' } },
        title: formatMessage(messages.endedOn),
        format: data =>
          data ? formatDate(data) : formatMessage(messages.nullText),
      },
      { db: 'deviceName', title: formatMessage(messages.deviceName) },
      {
        db: 'sampleOriginSiteName',
        title: formatMessage(messages.sampleOriginSiteName),
      },
      { db: 'sampleId', title: formatMessage(messages.sampleId) },
      {
        db: 'sampleGroup',
        extraProps: { style: { width: '80px' } },
        title: formatMessage(messages.sampleGroup),
      },
      { db: 'patientId', title: formatMessage(messages.patiendId) },
    ]
    const askConfirmationForExport = this.props.table.total > 1000

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
          onClickExport={this.clickResultListExport}
          askConfirmationForExport={askConfirmationForExport}
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

export default enhance(ResultList)
