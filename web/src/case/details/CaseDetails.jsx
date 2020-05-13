import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'

// Material-UI
import { fetchResults, exportResults } from '../../result/ResultRedux'
import { formatDate } from '../../shared/utils/dateFormat'
import Results from '../../result/historyResults/HistoryResults'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'

const messages = defineMessages({
  endedOn: {
    id: 'pages.CaseDetails.endedOn',
    defaultMessage: 'Test Date',
  },
  sampleOriginSiteName: {
    id: 'pages.CaseDetails.sampleOriginSiteName',
    defaultMessage: 'Attending clinic',
  },
  sampleId: {
    id: 'pages.CaseDetails.sampleId',
    defaultMessage: 'Sample ID',
  },
  resultText: {
    id: 'pages.CaseDetails.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.CaseDetails.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
  },
  resultTreatmentStatus: {
    id: 'pages.CaseDetails.resultTreatmentStatus',
    defaultMessage: 'Treatment',
  },
  patiendId: {
    id: 'pages.CaseDetails.patiendId',
    defaultMessage: 'Patient ID',
  },
  resultCategoryCopiesMl: {
    id: 'pages.CaseDetails.resultCategoryHiv',
    defaultMessage: 'HIV',
  },
  diagnosticResults: {
    id: 'pages.diagnosticResults.resultCategoryHiv',
    defaultMessage: 'Diagnostic Results',
  },
})

const CaseDetails = ({
  intl,
  history,
  location,
  match,
  device,
  disabled,
  displayPreferences,
  items,
  table,
  ...props
}) => {
  const FILTERS_CONFIG = {
    assayAndResultCategory: true,
    geography: true,
    state: true,
    lga: true,
    date: true,
    patientOrResearchId: true,
    sampleId: true,
    errorCode: true,
    siteName: true,
    sampleOriginSite: true,
    workflowStatus: true,
  }

  const resultColumns = [
    {
      key: 'endedOn',
      label: intl.formatMessage(messages.endedOn),
      formatter: value => formatDate(value),
      sortable: true,
    },

    {
      key: 'sampleOriginSiteName',
      label: intl.formatMessage(messages.sampleOriginSiteName),
      sortable: true,
      hiddenOn: 'sm',
    },
    {
      key: 'sampleId',
      label: intl.formatMessage(messages.sampleId),
      sortable: true,
    },
    {
      key: 'resultText',
      label: intl.formatMessage(messages.resultText),
      sortable: true,
    },

    {
      key: 'resultWorkflowStatus',
      label: intl.formatMessage(messages.resultWorkflowStatus),
      sortable: true,
      hiddenOn: 'sm',
    },
    {
      key: 'treatmentStatusInfo',
      label: intl.formatMessage(messages.resultTreatmentStatus),
      sortable: true,
      tooltip: 'resultTreatmentStatusName',
      hiddenOn: 'sm',
    },
  ]
  const searchSanitizer = makeSearchParamsSanitizer({
    availableSortCol: _.map(
      _.filter(resultColumns, elem => elem.sortable),
      column => column.key
    ),
  })
  const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
  const filtersFromLocation = composeSanitizer(
    _.flowRight(
      filtersSanitizer,
      searchParams => searchParams.get('filters') || ''
    ),
    searchSanitizer
  )
  const once = useRef(false)
  useEffect(() => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    const { sortCol, sortDir, pageAt, pageSize } = props
    if (!sanitized) {
      filtersParams.set('caseId', match.params.caseId)
      props.fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.params])

  const onRowClick = () => ({
    currentTarget: {
      dataset: { resultId },
    },
  }) => history.push(`/browse/result/${resultId}`)
  const onExportClick = () => formatType => {
    const { sortCol, sortDir, pageAt, pageSize } = props
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      props.exportResults(
        filtersParams,
        formatType,
        sortCol,
        sortDir,
        pageAt,
        pageSize
      )
    }
  }
  return (
    <Results
      match={match}
      history={history}
      location={location}
      sortDir={props.sortDir}
      sortCol={props.sortCol}
      intl={intl}
      pageAt={props.pageAt}
      pageSize={props.pageSize}
      columns={resultColumns}
      table={table}
      items={items}
      onRowClick={onRowClick()}
      onExportClick={onExportClick(props)}
      title={intl.formatMessage(messages.diagnosticResults)}
    />
  )
}

export default _.flowRight(
  injectIntl,
  connect(
    (state, ownProps) => {
      const { items, table } = state.result
      return {
        items,
        table,
        ...makeSortPageSelector({
          sortCol: 'endedOn',
          sortDir: 'desc',
        })(ownProps),
      }
    },
    {
      fetchResults,
      exportResults,
    }
  )
)(CaseDetails)
