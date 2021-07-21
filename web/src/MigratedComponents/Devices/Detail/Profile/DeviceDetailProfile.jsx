import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Card from '@material-ui/core/Card'
import NotesIcon from '@material-ui/icons/ChatBubbleOutline'
import { ResponsiveBar } from '@nivo/bar'
import resultMessages from '../../../../result/list/messages.js'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../../shared/selectors/searchParams'
import { useAuthState } from '../../../../Providers/AuthProvider'
import { sanitizeFiltersStringBy } from '../../../../filter/utils'
import Results from '../../../../result/historyResults/HistoryResults'
import ColoredNumber from '../../../../components/shared/ColoredNumber'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { fetchResults, exportResults } from '../../../../result/ResultRedux'
import { tokens } from '../../../../deviceApproval/DeviceApprovalRedux'
import {
  showDialog,
  hideDialog,
  updateDeviceMaintenance,
  updateDeviceMaintenanceStatus,
  exportDeviceLogs,
} from '../../../../device/DeviceRedux'
import Summary from '../../../../globals/components/Summary'
import requirePermissions from '../../../../components/shared/requirePermissions'
import CalibrationDialog from '../../Maintenance/CalibrationDialog'
import WarrantyDialog from '../../Maintenance/WarrantyDialog'
import DeviceMaintenanceStatusDialog from '../../Maintenance/DeviceMaintenanceStatusDialog'
import messages from './messages'
import useI18n from '../../../../Hooks/i18n/useI18n'

import styles from '../DeviceDetail.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = {
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
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  connect(
    state => {
      const { activeDialog, performanceReport } = state.device
      const {
        deviceMaintenanceStatus: { items: maintenanceStatus },
      } = state
      const { items, table } = state.result
      const { culture } = state.user
      return {
        activeDialog,
        performanceReport,
        maintenanceStatus,
        culture,
        items,
        table,
      }
    },
    {
      showDialog,
      hideDialog,
      updateDeviceMaintenanceStatus,
      updateDeviceMaintenance,
      fetchResults,
      exportResults,
      exportDeviceLogs,
    }
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'endedOn',
      sortDir: 'desc',
    })
  ),
  withHandlers({
    onInitialLoad:
      ({
        device,
        location,
        fetchResults,
        sortCol,
        sortDir,
        pageAt,
        pageSize,
      }) =>
      () => {
        const { sanitized, value: filtersParams } =
          filtersFromLocation(location)

        if (!sanitized) {
          filtersParams.set('deviceId', device.get('id'))
          fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
        }
      },
    onExportClick:
      ({
        device,
        location,
        exportResults,
        sortCol,
        sortDir,
        pageAt,
        pageSize,
      }) =>
      () => {
        const { sanitized, value: filtersParams } =
          filtersFromLocation(location)
        if (!sanitized) {
          filtersParams.set('deviceId', device.get('id'))
          exportResults(
            filtersParams,
            'xlsx',
            sortCol,
            sortDir,
            pageAt,
            pageSize,
            'xlsx',
            'deviceResults'
          )
        }
      },
    onExportDeviceLogsClick:
      ({ device, location, exportDeviceLogs }) =>
      () => {
        const { sanitized, value: filtersParams } =
          filtersFromLocation(location)
        if (!sanitized) {
          filtersParams.set('deviceId', device.get('id'))
          exportDeviceLogs(filtersParams, 'xlsx', 'deviceLogs')
        }
      },
    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { resultId },
        },
        // TODO: correct path?
      }) =>
        navigate(`/browse/result/${resultId}`),
    onToggleDeviceApproval:
      ({ device, updateSingleDevice }) =>
      () =>
        updateSingleDevice({
          deviceId: device.get('id'),
          data: {
            approvalToken:
              device.get('approvalToken') !== tokens.APPROVED
                ? tokens.APPROVED
                : tokens.ASSIGNED,
          },
        }),
    onShowCalibrationDialog:
      ({ showDialog, device }) =>
      () => {
        showDialog('calibration', device)
      },
    onShowMaintenanceDialog:
      ({ showDialog, device }) =>
      () => {
        showDialog('maintenance', device)
      },
    onShowWarrantyDialog:
      ({ showDialog, device }) =>
      () => {
        showDialog('warranty', device)
      },
    onHideDialog:
      ({ hideDialog }) =>
      () =>
        hideDialog(),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const { sanitized: filtersSanitized, value: filtersParams } =
        filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
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

PerformanceBarChart.propTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  series: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  color: PropTypes.string.isRequired,
  avgValue: PropTypes.number.isRequired,
  maxValue: PropTypes.number.isRequired,
  info: PropTypes.string.isRequired,
}

const PerformanceReport = ({ performanceReport, culture }) => {
  const payload = performanceReport.toJS()
  let maxUtilizationRate = 0
  let maxErrorRate = 0
  const { formatMessage } = useI18n()
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
                  <p>{formatMessage(messages.utilizationRate)}</p>
                  <PerformanceBarChart
                    data={data}
                    series={utilizationRateSeries}
                    color="--aspect-color-shakespeare"
                    avgValue={avgUtilizationRate}
                    maxValue={maxUtilizationRate}
                    info={formatMessage(messages.utilizationRate)}
                  />
                  <div className={cssClasses('Graph_Legend')}>
                    <div data-utilization-rate-legend>
                      <div />
                      <span>{formatMessage(messages.utilizationRate)}</span>
                    </div>
                    <div data-utilization-rate-average-legend>
                      <div /> <span> {formatMessage(messages.target)} </span>
                    </div>
                    <div data-utilization-rate-above-average-legend>
                      <div /> <span>{formatMessage(messages.aboveTarget)}</span>
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
                    <div /> <span>{formatMessage(messages.errorRate)} </span>
                  </div>
                  <div data-error-rate-average-legend>
                    <div />
                    <span> {formatMessage(messages.countryAverage)}</span>
                  </div>
                  <div data-error-rate-above-average-legend>
                    <div /> <span>{formatMessage(messages.aboveAverage)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}

PerformanceReport.propTypes = {
  performanceReport: PropTypes.oneOfType([PropTypes.object]).isRequired,
  culture: PropTypes.string.isRequired,
}

const DeviceDetailProfile = ({
  navigate,
  location,
  // m-tch,
  device,
  disabled,
  devicePerformance,
  // --- injected by recompose ---
  onToggleDeviceApproval,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  activeDialog,
  onShowMaintenanceDialog,
  onShowCalibrationDialog,
  onShowWarrantyDialog,
  onHideDialog,
  onMaintenanceSubmit,
  onCalibrationSubmit,
  onWarrantySubmit,
  table,
  items,
  onRowClick,
  onExportClick,
  onExportDeviceLogsClick,
}) => {
  const { formatMessage, formatNumber, formatDate, dateFNSLocale } = useI18n()
  const {
    culture,
    displayPreferences: { utilizationRateThreshold, errorRateThreshold },
  } = useAuthState()

  const dailyCapacity = device.get('dailyCapacity')
  const resultCountThisMonth = device.get('resultCountThisMonth')
  const errorCountThisMonth = device.get('errorCountThisMonth')
  const utilizationRateThisMonth = device.get('utilizationRateThisMonth')
  const errorRateThisMonth = device.get('errorRateThisMonth')
  const calibrationNotes = device.get('calibrationNotes')
  const warrantyNotes = device.get('warrantyNotes')

  const maintenanceStatusNotes =
    !device.get('maintenanceStatusNotes') ||
    device.get('maintenanceStatusNotes') === ''
      ? null
      : device.get('maintenanceStatusNotes')
  const resultColumns = [
    {
      key: 'endedOn',
      label: formatMessage(messages.endedOn),
      formatter: value => formatDate(value),
      sortable: true,
    },
    {
      key: 'sampleOriginSiteName',
      label: formatMessage(messages.sampleOriginSiteName),
      sortable: true,
    },
    {
      key: 'sampleId',
      label: formatMessage(messages.sampleId),
      sortable: true,
    },
    {
      key: 'resultText',
      label: formatMessage(messages.resultText),
      sortable: true,
    },
    {
      key: 'errorCode',
      label: formatMessage(messages.errorCode),
      sortable: true,
    },
    {
      key: 'resultWorkflowStatusI18nkey',
      formatter: value => formatMessage(resultMessages[value]),
      label: formatMessage(messages.resultWorkflowStatus),
      sortable: true,
    },
    {
      key: 'patientId',
      label: formatMessage(messages.patientId),
      sortable: true,
    },
  ]

  const AuthenticatedResults = requirePermissions({
    permissions: ['result:view'],
  })(Results)

  const maintenanceStatusText = device.get('maintenanceStatusI18nKey')
    ? formatMessage(messages[device.get('maintenanceStatusI18nKey')])
    : formatMessage(messages.undefinedValue)

  // convert 0/1 numbers of maintenanceStatusActive and maintenanceStatusManuallySet to bool
  const isMaintenanceStatusChangeDisabled = !!(
    device.get('maintenanceStatusActive') &&
    !device.get('maintenanceStatusManuallySet')
  )

  const formatMaintenanceDate = date =>
    date ? formatDate(date) : formatMessage(messages.undefinedValue)

  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <div>
            <Summary
              title={formatMessage(messages.deviceType)}
              description={device.getIn(['deviceType', 'name'])}
              to={`/browse/device?filters=deviceTypeId%3D${device.getIn([
                'deviceType',
                'id',
              ])}`}
              action={
                <Fragment>
                  <Tooltip
                    title={formatMessage(messages.deviceLogsTooltip)}
                    placement="right"
                  >
                    <Button
                      variant="contained"
                      color="success"
                      onClick={onExportDeviceLogsClick}
                      disabled={disabled}
                    >
                      {formatMessage(messages.deviceLogs)}
                    </Button>
                  </Tooltip>
                </Fragment>
              }
            />
            <Summary
              title={
                isMaintenanceStatusChangeDisabled ? (
                  <AspectTooltip
                    className={cssClasses('deviceSummary__container')}
                    iconClass="deviceSummary__helpIcon"
                    showHelpIcon
                    title={formatMessage(
                      messages.deviceStatusChangeDisabledTooltip
                    )}
                  >
                    {formatMessage(messages.maintenance)}
                  </AspectTooltip>
                ) : (
                  formatMessage(messages.maintenance)
                )
              }
              description={
                <Fragment>
                  {maintenanceStatusText}
                  {maintenanceStatusNotes && (
                    <Tooltip
                      title={maintenanceStatusNotes}
                      placement="top"
                      disableInteractive
                    >
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
              action={
                <Button
                  variant="contained"
                  color="success"
                  onClick={onShowMaintenanceDialog}
                  disabled={isMaintenanceStatusChangeDisabled}
                >
                  {formatMessage(messages.buttonChange)}
                </Button>
              }
            />
            <Summary
              title={formatMessage(messages.calibration)}
              description={
                <Fragment>
                  {formatMaintenanceDate(device.get('calibrationDate'))}
                  {calibrationNotes && (
                    <Tooltip
                      title={calibrationNotes}
                      placement="top"
                      disableInteractive
                    >
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
              action={
                <Button
                  variant="contained"
                  color="success"
                  onClick={onShowCalibrationDialog}
                  disabled={disabled}
                >
                  {formatMessage(messages.buttonAddRecord)}
                </Button>
              }
            />
            <Summary
              title={formatMessage(messages.site)}
              description={device.get('siteName')}
              to={`/browse/site/${device.get('siteId')}`}
            />
            <Summary
              title={formatMessage(messages.connectivity)}
              description={formatMessage(messages.lastSeen, {
                lastSeen: dateFNSLocale.formatRelative(device.get('lastSeen')),
              })}
            />
            <Summary
              title={formatMessage(messages.warranty)}
              description={
                <Fragment>
                  {formatMaintenanceDate(device.get('warrantyDueDate'))}
                  {warrantyNotes && (
                    <Tooltip
                      title={warrantyNotes}
                      placement="bottom"
                      disableInteractive
                    >
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
              action={
                <Button
                  variant="contained"
                  color="success"
                  onClick={onShowWarrantyDialog}
                  disabled={disabled}
                >
                  {formatMessage(messages.buttonUpdate)}
                </Button>
              }
            />
            {utilizationRateThisMonth !== null && (
              <Summary
                title={
                  <AspectTooltip
                    className={cssClasses('deviceSummary__container')}
                    iconClass="deviceSummary__helpIcon"
                    showHelpIcon
                    title={
                      <React.Fragment>
                        {formatMessage(messages.utilizationRateExplain)}
                        {resultCountThisMonth !== null && (
                          <React.Fragment>
                            {`: ${resultCountThisMonth} / (${dailyCapacity}*30) = ${formatNumber(
                              utilizationRateThisMonth
                            )}`}
                          </React.Fragment>
                        )}
                      </React.Fragment>
                    }
                  >
                    {formatMessage(messages.utilizationRate)}
                  </AspectTooltip>
                }
                description={
                  <ColoredNumber
                    number={utilizationRateThisMonth}
                    formatNumberStyle="percent"
                    error={utilizationRateThisMonth < utilizationRateThreshold}
                  />
                }
              />
            )}
            <Summary
              title={
                <AspectTooltip
                  className={cssClasses('deviceSummary__container')}
                  iconClass="deviceSummary__helpIcon"
                  showHelpIcon
                  title={
                    <React.Fragment>
                      {formatMessage(messages.errorRateExplain)}
                      {errorRateThisMonth !== null && (
                        <React.Fragment>
                          {`: ${errorCountThisMonth} / ${resultCountThisMonth} =
                          ${formatNumber(errorRateThisMonth)}`}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  }
                >
                  {formatMessage(messages.errorRate)}
                </AspectTooltip>
              }
              description={
                errorRateThisMonth !== null ? (
                  <ColoredNumber
                    number={errorRateThisMonth}
                    formatNumberStyle="percent"
                    error={errorRateThisMonth > errorRateThreshold}
                  />
                ) : (
                  formatMessage(messages.undefinedValue)
                )
              }
            />
            {/* Approval Status Summary */}
            <Summary
              title={formatMessage(messages.approval)}
              description={formatMessage(
                messages[device.get('approvalStatusI18nKey')]
              )}
              action={
                <Button
                  variant="contained"
                  color="success"
                  onClick={onToggleDeviceApproval}
                  disabled={disabled}
                >
                  {formatMessage(messages.buttonChange)}
                </Button>
              }
            />
          </div>
        </Card>
        <CalibrationDialog
          device={device}
          isDialogActive={activeDialog.get('name') === 'calibration'}
          onCancel={onHideDialog}
          onSubmit={onCalibrationSubmit}
        />
        <DeviceMaintenanceStatusDialog
          device={device}
          isDialogActive={activeDialog.get('name') === 'maintenance'}
          onCancel={onHideDialog}
          onSubmit={onMaintenanceSubmit}
        />
        <WarrantyDialog
          device={device}
          isDialogActive={activeDialog.get('name') === 'warranty'}
          onCancel={onHideDialog}
          onSubmit={onWarrantySubmit}
        />
      </section>

      <PerformanceReport
        performanceReport={devicePerformance}
        // ma-tch={m-atch}
        location={location}
        culture={culture}
      />

      <AuthenticatedResults
        // ma-tch={m-atch}
        navigate={navigate}
        location={location}
        sortDir={sortDir}
        sortCol={sortCol}
        pageAt={pageAt}
        pageSize={pageSize}
        columns={resultColumns}
        table={table}
        items={items}
        onRowClick={onRowClick}
        onExportClick={onExportClick}
        title={formatMessage(messages.testHistory)}
      />
    </div>
  )
}

DeviceDetailProfile.propTypes = {
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  // ma-tch: PropTypes.oneOfType([PropTypes.object]).isRequired,
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
  disabled: PropTypes.bool.isRequired,
  devicePerformance: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onToggleDeviceApproval: PropTypes.func.isRequired,
  sortCol: PropTypes.string.isRequired,
  sortDir: PropTypes.string.isRequired,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  activeDialog: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onShowMaintenanceDialog: PropTypes.func.isRequired,
  onShowCalibrationDialog: PropTypes.func.isRequired,
  onShowWarrantyDialog: PropTypes.func.isRequired,
  onHideDialog: PropTypes.func.isRequired,
  onMaintenanceSubmit: PropTypes.func.isRequired,
  onCalibrationSubmit: PropTypes.func.isRequired,
  onWarrantySubmit: PropTypes.func.isRequired,
  table: PropTypes.oneOfType([PropTypes.object]).isRequired,
  items: PropTypes.oneOfType([PropTypes.object]).isRequired,
  onRowClick: PropTypes.func.isRequired,
  onExportClick: PropTypes.func.isRequired,
  onExportDeviceLogsClick: PropTypes.func.isRequired,
}

export default enhance(DeviceDetailProfile)
