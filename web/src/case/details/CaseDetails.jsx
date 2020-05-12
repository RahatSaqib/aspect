import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { useEffect, useRef } from 'react'
import { compose, setPropTypes } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md'
import Button from '@material-ui/core/Button'
import { fetchResults, exportResults } from '../../result/ResultRedux'
import { formatDate } from '../../shared/utils/dateFormat'
import Results from '../../result/historyResults/historyResults'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'

const cssClasses = classnames.bind(require('./CaseDetails.css'))

const messages = defineMessages({
  deviceType: {
    id: 'pages.DeviceDetailProfile.deviceType',
    defaultMessage: 'Device type',
  },
  status: {
    id: 'pages.DeviceDetailProfile.status',
    defaultMessage: 'Status',
  },
  calibration: {
    id: 'pages.DeviceDetailProfile.calibration',
    defaultMessage: 'Calibration',
  },
  site: {
    id: 'pages.DeviceDetailProfile.site',
    defaultMessage: 'Site',
  },
  connectivity: {
    id: 'pages.DeviceDetailProfile.connectivity',
    defaultMessage: 'Connectivity',
  },
  lastSeen: {
    id: 'pages.DeviceDetailProfile.lastSeenOn',
    defaultMessage: 'Last seen {lastSeen}',
  },
  warranty: {
    id: 'pages.DeviceDetailProfile.warranty',
    defaultMessage: 'Warranty',
  },
  utilizationRate: {
    id: 'pages.DeviceDetailProfile.utilizationRate',
    defaultMessage: 'Utilization Rate',
  },
  utilizationRateExplain: {
    id: 'pages.DeviceDetailProfile.utilizationRateExplain',
    defaultMessage:
      'Number of results in the last 30 days divided by the daily capacity of the instrument multiplied by 30 days',
  },
  errorRate: {
    id: 'pages.DeviceDetailProfile.errorRate',
    defaultMessage: 'Error Rate',
  },
  errorRateExplain: {
    id: 'pages.DeviceDetailProfile.errorRateExplain',
    defaultMessage:
      'Number of errors divided by number of results in the last 30 days',
  },
  endedOn: {
    id: 'pages.DeviceDetailProfile.endedOn',
    defaultMessage: 'Test Date',
  },
  sampleOriginSiteName: {
    id: 'pages.DeviceDetailProfile.sampleOriginSiteName',
    defaultMessage: 'Sample Origin Site',
  },
  sampleId: {
    id: 'pages.DeviceDetailProfile.sampleId',
    defaultMessage: 'Sample ID',
  },
  errorCode: {
    id: 'pages.DeviceDetailProfile.errorCode',
    defaultMessage: 'Error Code',
  },
  resultText: {
    id: 'pages.DeviceDetailProfile.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.DeviceDetailProfile.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
  },
  patientId: {
    id: 'pages.DeviceDetailProfile.patientId',
    defaultMessage: 'Patient ID',
  },
  paginatorStatus: {
    id: 'pages.DeviceDetailProfile.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# result}
      other {# results}
    }`,
  },
  noResults: {
    id: 'pages.DeviceDetailProfile.noResults',
    defaultMessage: 'No Results',
  },
  undefinedValue: {
    id: 'pages.DeviceDetailProfile.undefinedValue',
    defaultMessage: 'n/a',
  },
  notes: {
    id: 'pages.DeviceDetailProfile.notes',
    defaultMessage: 'notes',
  },
  buttonAddRecord: {
    id: 'pages.DeviceDetailProfile.buttonAddRecord',
    defaultMessage: 'Add Record',
  },
  buttonUpdate: {
    id: 'pages.DeviceDetailProfile.buttonUpdate',
    defaultMessage: 'Update',
  },
  buttonChange: {
    id: 'pages.DeviceDetailProfile.buttonChange',
    defaultMessage: 'Change',
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
  console.log('props', props)
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

  const searchSanitizer = makeSearchParamsSanitizer({
    availableSortCol: [
      'endedOn',
      'deviceName',
      'sampleOriginSiteName',
      'sampleId',
      'errorCode',
      'patientId',
    ],
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
    if (once.current === false) {
      once.current = true
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      const { sortCol, sortDir, pageAt, pageSize } = props
      if (!sanitized) {
        filtersParams.set('caseId', match.params.caseId)
        props.fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    }
  }, [])

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
      key: 'errorCode',
      label: intl.formatMessage(messages.errorCode),
      sortable: true,
    },
    {
      key: 'resultWorkflowStatus',
      label: intl.formatMessage(messages.resultWorkflowStatus),
      sortable: true,
    },
    {
      key: 'patientId',
      label: intl.formatMessage(messages.patientId),
      sortable: true,
    },
  ]

  const onRowClick = ({ history }) => ({
    currentTarget: {
      dataset: { resultId },
    },
  }) => history.push(`/browse/result/${resultId}`)
  const onExportClick = ({
    location,
    exportResults,
    sortCol,
    sortDir,
    pageAt,
    pageSize,
  }) => formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      exportResults(
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
      cssClasses={cssClasses}
      table={table}
      items={items}
      onRowClick={onRowClick}
      onExportClick={onExportClick}
    />
  )
}

const mapStateToProps = (state, ownProps) => {
  const { caseId } = ownProps.match.params
  return {
    caseId,
  }
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
