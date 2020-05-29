import _ from 'lodash'
import classnames from 'classnames/bind'
import React, { Fragment } from 'react'
import { defineMessages, injectIntl } from 'react-intl'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Card from '@material-ui/core/Card'
import { MdFileDownload } from 'react-icons/md'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import NotesIcon from '@material-ui/icons/ChatBubbleOutline'
import { ResponsiveBar } from '@nivo/bar'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../shared/selectors/searchParams'
import { formatDate, formatRelative } from '../../../shared/utils/dateFormat'
import { sanitizeFiltersStringBy } from '../../../filter/utils'
import Results from '../../../result/historyResults/HistoryResults'
import ColoredNumber from '../../../components/shared/ColoredNumber'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import { fetchResults, exportResults } from '../../../result/ResultRedux'
import { tokens } from '../../../deviceStatus/DeviceStatusRedux'
import {
  showDialog,
  hideDialog,
  updateDeviceMaintenance,
} from '../../DeviceRedux'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import Summary from '../../../globals/components/Summary'
import requirePermissions from '../../../components/shared/requirePermissions'
import CalibrationDialog from '../../maintenance/CalibrationDialog'
import WarrantyDialog from '../../maintenance/WarrantyDialog'

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
    id: 'pages.DeviceDetailProfile.endedOn',
    defaultMessage: 'Test Date',
  },
  sampleCollectionSiteName: {
    id: 'pages.DeviceDetailProfile.sampleCollectionSiteName',
    defaultMessage: 'Sample Collection Site',
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
  testHistory: {
    id: 'pages.DeviceDetailProfile.testHistory',
    defaultMessage: 'Test history',
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
  errorCode: true,
  siteName: true,
  sampleCollectionSite: true,
  workflowStatus: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'endedOn',
    'deviceName',
    'sampleCollectionSiteName',
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
const formatMaintenanceDate = (intl, date) => {
  if (!date) {
    return intl.formatMessage(messages.undefinedValue)
  }
  return formatDate(date)
}

const enhance = compose(
  injectIntl,
  connect(
    state => {
      const { activeDialog, performanceReport } = state.device
      const { items, table } = state.result
      const { culture } = state.user
      return {
        activeDialog,
        performanceReport,
        culture,
        items,
        table,
      }
    },
    {
      showDialog,
      hideDialog,
      updateDeviceMaintenance,
      fetchResults,
      exportResults,
    }
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'endedOn',
      sortDir: 'desc',
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
      currentTarget: {
        dataset: { resultId },
      },
      // TODO: correct path?
    }) => history.push(`/browse/result/${resultId}`),
    onToggleDeviceStatus: ({ device, updateSingleDevice }) => () =>
      updateSingleDevice(device.get('id'), {
        statusToken:
          device.get('statusToken') !== tokens.APPROVED
            ? tokens.APPROVED
            : tokens.ASSIGNED,
      }),
    onShowCalibrationDialog: ({ showDialog, device }) => () => {
      showDialog('calibration', device)
    },
    onShowWarrantyDialog: ({ showDialog, device }) => () => {
      showDialog('warranty', device)
    },
    onHideDialog: ({ hideDialog }) => () => hideDialog(),

    onCalibrationSubmit: ({ device, updateDeviceMaintenance }) => values => {
      updateDeviceMaintenance({
        externalId: 'calibration',
        device,
        values,
      })
    },
    onWarrantySubmit: ({ device, updateDeviceMaintenance }) => values => {
      updateDeviceMaintenance({
        externalId: 'warranty',
        device,
        values,
      })
    },
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

const PerformanceBarChart = ({
  data,
  series,
  color,
  avgValue,
  maxValue,
  info,
}) => (
  <ResponsiveBar
    data={data}
    indexBy="period"
    keys={series.map(x => x.key)}
    margin={{ top: 10, right: 0, bottom: 90, left: 50 }}
    padding={0.01} // between stacks, (ratio)
    innerPadding={1} // between bars in a stack, (px)
    enableGridY={false}
    enableLabel={false}
    defs={[
      {
        id: 'lines',
        type: 'patternLines',
        background: 'inherit',
        color: process.env[color],
        rotation: 45,
        lineWidth: 7,
        spacing: 8,
      },
    ]}
    fill={[
      {
        match: {
          id: 'exceededErrorRate',
        },
        id: 'lines',
      },
      {
        match: {
          id: 'exceededUtilizationRate',
        },
        id: 'lines',
      },
    ]}
    axisLeft={{
      tickRotation: 0,
      legend: 'Percentage(%)',
      legendPosition: 'middle',
      legendOffset: -40,
    }}
    colors={bar => series.find(x => x.key === bar.id).color}
    animate
    markers={[
      {
        axis: 'y',
        value: avgValue,
        lineStyle: {
          stroke: process.env['--aspect-color-ship-cove'],
          strokeWidth: 2,
        },
        legendOrientation: 'vertical',
      },
    ]}
    tooltip={({ color, indexValue }) => {
      const periodData = data.find(x => x.period === indexValue)
      const value =
        info === 'Error Rate'
          ? periodData.errorRate + periodData.exceededErrorRate
          : periodData.utilizationRate + periodData.exceededUtilizationRate

      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={cssClasses('Performance--graph-tooltip-color')}
              style={{ backgroundColor: color }}
            />
            {`% ${info} `}
          </div>
          <div>
            {`${indexValue}: `}
            <strong>{value}</strong>%
          </div>
        </div>
      )
    }}
    maxValue={maxValue}
    motionStiffness={90}
    motionDamping={15}
  />
)
const PerformanceReport = enhance(({ performanceReport, culture }) => {
  const payload = performanceReport.toJS()
  let maxUtilizationRate = 0
  let maxErrorRate = 0
  if (payload.data) {
    payload.data.forEach(item => {
      const date = new Date(item.monthTested)
      const monthName = date.toLocaleString(culture, {
        month: 'short',
        timeZone: 'UTC',
      })
      item.period = monthName
      item.exceededErrorRate =
        item.errorRate > payload.errorRateAvg
          ? item.errorRate - payload.errorRateAvg
          : 0
      item.errorRate =
        item.errorRate > payload.errorRateAvg
          ? payload.errorRateAvg
          : item.errorRate
      item.exceededUtilizationRate =
        item.utilizationRate > payload.utilizationRateAvg
          ? item.utilizationRate - payload.utilizationRateAvg
          : 0
      item.utilizationRate =
        item.utilizationRate > payload.utilizationRateAvg
          ? payload.utilizationRateAvg
          : item.utilizationRate
    })
    maxUtilizationRate = payload.data.reduce(
      (prev, current) =>
        prev > current.utilizationRate + current.exceededUtilizationRate
          ? prev
          : current.utilizationRate + current.exceededUtilizationRate,
      payload.utilizationRateAvg
    )
    maxErrorRate = payload.data.reduce(
      (prev, current) =>
        prev > current.errorRate + current.exceededErrorRate
          ? prev
          : current.errorRate + current.exceededErrorRate,
      payload.errorRateAvg
    )

    maxErrorRate = maxErrorRate === 100 ? maxErrorRate : maxErrorRate + 10
    maxUtilizationRate += 10
  }

  const avgUtilizationRate = payload.utilizationRateAvg
  const avgErrorRate = payload.errorRateAvg
  const { data } = payload
  const { '--aspect-color-white': colorWhite } = process.env
  const utilizationRateSeries = [
    {
      label: 'Utilization Rate',
      key: 'utilizationRate',
      color: process.env['--aspect-color-shakespeare'],
    },
    {
      label: 'Above Target Utilization Rate',
      key: 'exceededUtilizationRate',
      color: colorWhite,
    },
  ]
  const errorRateSeries = [
    {
      label: 'Error Rate',
      key: 'errorRate',
      color: process.env['--aspect-color-mandy'], // green
    },
    {
      label: 'Above Average Error Rate',
      key: 'exceededErrorRate',
      color: colorWhite,
    },
  ]

  return (
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Section')}>
        <p data-panel-title>Performance</p>
        <div data-graph-container>
          {data && data[0].utilizationRate !== null && (
            <div
              className={cssClasses('Graph_Container')}
              data-utilization-graph
            >
              {data && (
                <div>
                  <p>Utilization Rate</p>
                  <PerformanceBarChart
                    data={data}
                    series={utilizationRateSeries}
                    color="--aspect-color-shakespeare"
                    avgValue={avgUtilizationRate}
                    maxValue={maxUtilizationRate}
                    info="Utilization Rate"
                  />
                  <div className={cssClasses('Graph_Legend')}>
                    <div data-utilization-rate-legend>
                      <div /> <span> Utilization Rate</span>
                    </div>
                    <div data-utilization-rate-average-legend>
                      <div /> <span> Target </span>
                    </div>
                    <div data-utilization-rate-above-average-legend>
                      <div /> <span> Above Target </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={cssClasses('Graph_Container')}>
            {data && (
              <div>
                <p>Error Rate</p>
                <PerformanceBarChart
                  data={data}
                  series={errorRateSeries}
                  color="--aspect-color-mandy"
                  avgValue={avgErrorRate}
                  maxValue={maxErrorRate}
                  info="Error Rate"
                />
                <div className={cssClasses('Graph_Legend')}>
                  <div data-error-rate-legend>
                    <div /> <span> Error Rate</span>
                  </div>
                  <div data-error-rate-average-legend>
                    <div /> <span> Country Average </span>
                  </div>
                  <div data-error-rate-above-average-legend>
                    <div /> <span> Above Average</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
})

export const DeviceDetailProfile = ({
  intl,
  history,
  location,
  match,
  device,
  disabled,
  displayPreferences,
  // --- injected by recompose ---
  onToggleDeviceStatus,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  activeDialog,
  onShowCalibrationDialog,
  onShowWarrantyDialog,
  onHideDialog,
  onCalibrationSubmit,
  onWarrantySubmit,
  table,
  items,
  onRowClick,
  onExportClick,
}) => {
  const deviceName = device.get('name')
  const dailyCapacity = device.get('dailyCapacity')
  const resultCountThisMonth = device.get('resultCountThisMonth')
  const errorCountThisMonth = device.get('errorCountThisMonth')
  const utilizationRateThisMonth = device.get('utilizationRateThisMonth')
  const errorRateThisMonth = device.get('errorRateThisMonth')
  const calibrationNotes = device.get('calibrationNotes')
  const warrantyNotes = device.get('warrantyNotes')
  const resultColumns = [
    {
      key: 'endedOn',
      label: intl.formatMessage(messages.endedOn),
      formatter: value => formatDate(value),
      sortable: true,
    },
    {
      key: 'sampleCollectionSiteName',
      label: intl.formatMessage(messages.sampleCollectionSiteName),
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

  const AuthenticatedResults = requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  })(Results)
  return (
    <div>
      <Helmet title={deviceName} />
      <DeviceDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        disabled={disabled}
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
                <Button
                  variant="contained"
                  onClick={onToggleDeviceStatus}
                  disabled={disabled}
                >
                  {intl.formatMessage(messages.buttonChange)}
                </Button>
              }
            />
            <Summary
              title={intl.formatMessage(messages.calibration)}
              description={
                <Fragment>
                  {formatMaintenanceDate(intl, device.get('calibrationDate'))}
                  {calibrationNotes && (
                    <Tooltip title={calibrationNotes} placement="top">
                      <IconButton
                        aria-label={intl.formatMessage(messages.notes)}
                      >
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
              action={
                <Button
                  variant="contained"
                  onClick={onShowCalibrationDialog}
                  disabled={disabled}
                >
                  {intl.formatMessage(messages.buttonAddRecord)}
                </Button>
              }
            />
            <Summary
              title={intl.formatMessage(messages.site)}
              description={device.get('siteName')}
              to={`/browse/site/${device.get('siteId')}`}
            />
            <Summary
              title={intl.formatMessage(messages.connectivity)}
              description={intl.formatMessage(messages.lastSeen, {
                lastSeen: formatRelative(intl, device.get('lastSeen')),
              })}
            />
            <Summary
              title={intl.formatMessage(messages.warranty)}
              description={
                <Fragment>
                  {formatMaintenanceDate(intl, device.get('warrantyDueDate'))}
                  {warrantyNotes && (
                    <Tooltip title={warrantyNotes} placement="bottom">
                      <IconButton
                        aria-label={intl.formatMessage(messages.notes)}
                      >
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
              action={
                <Button
                  variant="contained"
                  onClick={onShowWarrantyDialog}
                  disabled={disabled}
                >
                  {intl.formatMessage(messages.buttonUpdate)}
                </Button>
              }
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
        <CalibrationDialog
          intl={intl}
          device={device}
          isDialogActive={activeDialog.get('name') === 'calibration'}
          onCancel={onHideDialog}
          onSubmit={onCalibrationSubmit}
        />
        <WarrantyDialog
          intl={intl}
          device={device}
          isDialogActive={activeDialog.get('name') === 'warranty'}
          onCancel={onHideDialog}
          onSubmit={onWarrantySubmit}
        />
      </section>
      <PerformanceReport match={match} location={location} />
      <AuthenticatedResults
        match={match}
        history={history}
        location={location}
        sortDir={sortDir}
        sortCol={sortCol}
        intl={intl}
        pageAt={pageAt}
        pageSize={pageSize}
        columns={resultColumns}
        table={table}
        items={items}
        onRowClick={onRowClick}
        onExportClick={onExportClick}
        title={intl.formatMessage(messages.testHistory)}
      />
    </div>
  )
}

export default enhance(DeviceDetailProfile)
