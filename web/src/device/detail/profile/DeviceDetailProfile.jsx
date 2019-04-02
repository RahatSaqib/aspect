import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Card from '@material-ui/core/Card'
import MdFileDownload from 'react-icons/lib/md/file-download'
import Helmet from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../../filter/utils'
import DataTableProgressBar from '../../../components/shared/DataTableProgressBar'
import ColoredNumber from '../../../components/shared/ColoredNumber'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import BrowseTablePaginator from '../../../globals/components/BrowseTablePaginator'
import BrowseEmptyList from '../../../globals/components/BrowseEmptyList'
import { fetchResults, exportResults } from '../../../result/ResultRedux'
import { tokens } from '../../../deviceStatus/DeviceStatusRedux'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import Summary from '../../../globals/components/Summary'
import {
  ResultDataTable,
  ResultDataTableHead,
  ResultDataTableRow,
} from './ResultDataTable'
import requirePermissions from '../../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

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
    id: 'pages.DeviceDetailProfile.EndedOn',
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
  sampleGroup: {
    id: 'pages.DeviceDetailProfile.sampleGroup',
    defaultMessage: 'Sample Group',
  },
  resultText: {
    id: 'pages.DeviceDetailProfile.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.DeviceDetailProfile.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
  },
  patiendId: {
    id: 'pages.DeviceDetailProfile.patiendId',
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
})

const FILTERS_CONFIG = {
  assayAndResultCategory: true,
  geography: true,
  state: true,
  lga: true,
  date: true,
  patientOrResearchId: true,
  sampleId: true,
  sampleGroup: true,
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
    'sampleGroup',
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

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'endedOn',
      sortDir: 'desc',
    })
  ),
  withHandlers({
    onToggleDeviceStatus: ({ device, updateSingleDevice }) => () =>
      updateSingleDevice(device.get('id'), {
        statusToken:
          device.get('statusToken') !== tokens.APPROVED
            ? tokens.APPROVED
            : tokens.ASSIGNED,
      }),
  })
)

const enhanceResults = compose(
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  }),
  connect(
    state => ({
      items: state.result.items,
      table: state.result.table,
    }),
    bindActionCreators.bind(null, {
      fetchResults,
      exportResults,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      match,
      location,
      fetchResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        filtersParams.set('deviceId', match.params.deviceId)
        fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onExportClick: ({
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
    },

    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { resultId } },
      // TODO: correct path?
    }) => history.push(`/browse/result/${resultId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

const Results = enhanceResults(
  ({
    intl,
    history,
    location,
    sortDir,
    sortCol,
    pageAt,
    pageSize,
    // injected by recompose
    items,
    table,
    onRowClick,
    onExportClick,
  }) => (
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Section__Content')}>
        <header className={cssClasses('Header')}>
          <div className={cssClasses('Header__Title')}>Test history</div>
          <div className={cssClasses('Header__Actions')}>
            <IconButton onClick={onExportClick}>
              <MdFileDownload />
            </IconButton>
          </div>
        </header>
        <div>
          <DataTableProgressBar disabled={!table.loading} />
          {items.currentIdList.isEmpty() && (
            <BrowseEmptyList
              history={history}
              location={location}
              intl={intl}
            />
          )}
          {!items.currentIdList.isEmpty() && (
            <ResultDataTable
              selectable={false}
              className={cssClasses('ResultDataTable')}
            >
              <ResultDataTableHead
                history={history}
                location={location}
                sortColumnKey={sortCol}
                sortColumnDir={sortDir}
                columns={[
                  {
                    key: 'endedOn',
                    label: intl.formatMessage(messages.endedOn),
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
                    key: 'sampleGroup',
                    label: intl.formatMessage(messages.sampleGroup),
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
                  },
                  {
                    key: 'patientId',
                    label: intl.formatMessage(messages.patiendId),
                    sortable: true,
                  },
                ]}
              />
              <TableBody>
                {items.currentIdList
                  .map(id => items.byId.get(id))
                  .map(result => (
                    <ResultDataTableRow
                      key={result.get('id')}
                      intl={intl}
                      result={result}
                      onClick={onRowClick}
                      data-result-id={result.get('id')}
                    />
                  ))}
              </TableBody>
            </ResultDataTable>
          )}
          {!items.currentIdList.isEmpty() && (
            <BrowseTablePaginator
              history={history}
              location={location}
              intl={intl}
              paginatorStatus={messages.paginatorStatus}
              total={table.total}
              pageAt={pageAt}
              pageSize={pageSize}
            />
          )}
        </div>
      </Card>
    </section>
  )
)

export const DeviceDetailProfile = ({
  intl,
  history,
  location,
  match,
  device,
  displayPreferences,
  // --- injected by recompose ---
  onToggleDeviceStatus,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
}) => {
  const deviceName = `${device.getIn(['deviceType', 'name'])} at ${device.get(
    'siteName'
  )}`
  const dailyCapacity = device.get('dailyCapacity')
  const resultCountThisMonth = device.get('resultCountThisMonth')
  const errorCountThisMonth = device.get('errorCountThisMonth')
  const utilizationRateThisMonth = device.get('utilizationRateThisMonth')
  const errorRateThisMonth = device.get('errorRateThisMonth')
  return (
    <div>
      <Helmet title={deviceName} />
      <DeviceDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        title={deviceName}
      />
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <div>
            <Summary
              title={intl.formatMessage(messages.deviceType)}
              description={device.getIn(['deviceType', 'name'])}
              to={`/browse/device?filters=deviceTypeId%3D${device.getIn([
                'deviceType',
                'id',
              ])}`}
            />
            <Summary
              title={intl.formatMessage(messages.status)}
              description={device.get('status')}
              action={
                <Button variant="contained" onClick={onToggleDeviceStatus}>
                  Change
                </Button>
              }
            />
            <Summary
              title={intl.formatMessage(messages.calibration)}
              description="TODO: Up to date"
              action={<Button variant="contained">Add record</Button>}
            />
            <Summary
              title={intl.formatMessage(messages.site)}
              description={device.get('siteName')}
              to={`/browse/site/${device.get('siteId')}`}
            />
            <Summary
              title={intl.formatMessage(messages.connectivity)}
              description={intl.formatMessage(messages.lastSeen, {
                lastSeen: intl.formatRelative(device.get('lastSeen')),
              })}
            />
            <Summary
              title={intl.formatMessage(messages.warranty)}
              description="TODO: Expires in 18 months"
              action={<Button variant="contained">Update</Button>}
            />
            {utilizationRateThisMonth !== null && (
              <Summary
                title={
                  <AspectTooltip
                    showHelpIcon
                    title={
                      <React.Fragment>
                        {intl.formatMessage(messages.utilizationRateExplain)}
                        {resultCountThisMonth !== null && (
                          <React.Fragment>
                            {`: ${resultCountThisMonth} / (${dailyCapacity}*30) = ${intl.formatNumber(
                              utilizationRateThisMonth
                            )}`}
                          </React.Fragment>
                        )}
                      </React.Fragment>
                    }
                  >
                    {intl.formatMessage(messages.utilizationRate)}
                  </AspectTooltip>
                }
                description={
                  <ColoredNumber
                    number={utilizationRateThisMonth}
                    intl={intl}
                    formatNumberStyle="percent"
                    error={
                      utilizationRateThisMonth <
                      displayPreferences.get('utilizationRateThreshold')
                    }
                  />
                }
              />
            )}
            <Summary
              title={
                <AspectTooltip
                  showHelpIcon
                  title={
                    <React.Fragment>
                      {intl.formatMessage(messages.errorRateExplain)}
                      {errorRateThisMonth !== null && (
                        <React.Fragment>
                          {`: ${errorCountThisMonth} / ${resultCountThisMonth} =
                          ${intl.formatNumber(errorRateThisMonth)}`}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  }
                >
                  {intl.formatMessage(messages.errorRate)}
                </AspectTooltip>
              }
              description={
                errorRateThisMonth !== null ? (
                  <ColoredNumber
                    number={errorRateThisMonth}
                    intl={intl}
                    formatNumberStyle="percent"
                    error={
                      errorRateThisMonth >
                      displayPreferences.get('errorRateThreshold')
                    }
                  />
                ) : (
                  intl.formatMessage(messages.noResults)
                )
              }
            />
          </div>
        </Card>
      </section>
      <Results
        match={match}
        history={history}
        location={location}
        sortDir={sortDir}
        sortCol={sortCol}
        intl={intl}
        pageAt={pageAt}
        pageSize={pageSize}
      />
    </div>
  )
}

export default enhance(DeviceDetailProfile)
