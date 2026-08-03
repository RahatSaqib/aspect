import React, { Fragment, useState } from 'react'
import NotesIcon from '@mui/icons-material/ChatBubbleOutline'
import { Card, IconButton, Tooltip } from '@mui/material'
import flowRight from 'lodash/flowRight'
import PropTypes from 'prop-types'
import { ErrorBoundary } from 'react-error-boundary'
import { useIntl } from 'react-intl'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'
import { compose, lifecycle, withHandlers, withProps } from 'recompose'
import DeviceResultHistory from '../../../../components/DeviceResultHistory/DeviceResultHistory'
import PermissionChecker from '../../../../components/PermissionChecker'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import ColoredNumber from '../../../../components/shared/ColoredNumber'
import Summary from '../../../../components/Summary'
import { sanitizeFiltersStringBy } from '../../../../components/utils'
import useDeployments from '../../../../hooks/device/useDeployments'
import usePermissions from '../../../../hooks/person/usePermissions'
import useAuthState from '../../../../hooks/useAuthState'
import useFilterUpdate from '../../../../hooks/useFilterUpdate'
import useFilterValues from '../../../../hooks/useFilterValues'
import {
  exportDeviceLogs,
  hideDialog,
  showDialog,
  updateDeviceMaintenance,
  updateDeviceMaintenanceStatus,
} from '../../../../store/DeviceRedux'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
import {
  composeSanitizer,
  makeSearchParamsSanitizer,
  makeSortPageSelector,
} from '../../../../utils/selectors/searchParams'
import { formatRelative } from '../../../../utils/utils/dateFormat'
import CalibrationDialog from '../../Maintenance/CalibrationDialog'
import DeviceMaintenanceStatusDialog from '../../Maintenance/DeviceMaintenanceStatusDialog'
import WarrantyDialog from '../../Maintenance/WarrantyDialog'
import DecommissionDeviceDialog from '../DecommissionDeviceDialog'
import detailMessages from '../messages'
import ReactivateDeviceDialog from '../ReactivateDeviceDialog'
import styles from '../styles.module.css'
import DeploymentsSection from './DeploymentsSection'
import DeviceInstrumentsTable from './DeviceInstrumentsTable'
import messages from './messages'
import PerformanceReport from './PerformanceReport'

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
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['endedOn', 'deviceName', 'sampleOriginSiteName', 'sampleId', 'errorCode', 'patientId'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const enhance = compose(
  connect(
    state => {
      const { activeDialog, performanceReport } = state.device
      const { culture } = state.user
      return {
        activeDialog,
        performanceReport,
        culture,
      }
    },
    {
      showDialog,
      hideDialog,
      updateDeviceMaintenanceStatus,
      updateDeviceMaintenance,
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
    onExportDeviceLogsClick:
      ({ device, location, exportDeviceLogs }) =>
      () => {
        const { value: filtersParams } = filtersFromLocation(location)
        filtersParams.set('deviceId', device.get('id'))
        exportDeviceLogs(filtersParams, 'xlsx', 'deviceLogs')
      },
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
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
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
  })
)

const SectionDivider = ({ label }) => (
  <div className={styles.sectionDivider}>
    <span className={styles.sectionDivider__label}>{label}</span>
    <span className={styles.sectionDivider__line} />
  </div>
)

const DeviceDetailProfile = ({
  navigate,
  location,
  // m-tch,
  device,
  disabled,
  canExportDeviceLogs,
  devicePerformance,
  // --- injected by recompose ---
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
  onExportDeviceLogsClick,
  deviceTags,
}) => {
  const deviceListFilter = useFilterValues('/browse/device/list')
  const [addFilter] = useFilterUpdate()
  const { checkPermission } = usePermissions()
  const [decommissionDialogOpen, setDecommissionDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  // Any user who can edit devices can decommission and reactivate them.
  const canDecommission = checkPermission(['device:edit'])
  const isApproved = device.get('approvalToken') === 'approved'
  const isDecommissioned = device.get('approvalToken') === 'decommissioned'
  const { data: deploymentsData } = useDeployments(device.get('id'))
  const hasDeployments = (deploymentsData?.deployments ?? []).length > 0
  // Decommission only when the device is approved (active) and currently has deployments.
  const canDecommissionDevice = canDecommission && isApproved && hasDeployments
  // Reactivate only when the device is decommissioned and still has deployments.
  const canReactivateDevice = canDecommission && isDecommissioned && hasDeployments
  const showDecommissionButton = canDecommissionDevice
  const showReactivateButton = canReactivateDevice
  const isGeneXpertDevice = device.getIn(['deviceType', 'externalId']) === CONSTS.GENEXPERT_EXTERNAL_ID
  const canViewDakList = isGeneXpertDevice && checkPermission(['browse', '+deviceApiKey'])
  const { formatMessage, formatNumber, formatDate, formatRelativeTime } = useIntl()
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
    !device.get('maintenanceStatusNotes') || device.get('maintenanceStatusNotes') === ''
      ? null
      : device.get('maintenanceStatusNotes')

  const maintenanceStatusText = device.get('maintenanceStatusI18nKey')
    ? formatMessage(messages[device.get('maintenanceStatusI18nKey')])
    : formatMessage(messages.undefinedValue)

  // convert 0/1 numbers of maintenanceStatusActive and maintenanceStatusManuallySet to bool
  const isMaintenanceStatusChangeDisabled = Boolean(
    device.get('maintenanceStatusActive') && !device.get('maintenanceStatusManuallySet')
  )

  const formatMaintenanceDate = date => (date ? formatDate(date) : formatMessage(messages.undefinedValue))

  return (
    <div>
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <Card className={styles.Section__Content}>
          <div className={styles.summaryGrid}>
            {/* ── Overview ── */}
            <SectionDivider label={formatMessage(messages.sectionOverview)} />
            <Summary
              title={formatMessage(messages.site)}
              description={device.get('siteName') ? device.get('siteName') : formatMessage(messages.undeployed)}
              to={
                device.get('siteName') && device.get('siteId')
                  ? () => navigate(`/browse/site/${device.get('siteId')}`)
                  : undefined
              }
            />
            <Summary
              title={
                <span>
                  {formatMessage(messages.deviceType)}
                  {canExportDeviceLogs && (
                    <Tooltip title={formatMessage(messages.deviceLogsTooltip)} placement="right">
                      <button type="button" className={styles.fieldAction} onClick={onExportDeviceLogsClick}>
                        ({formatMessage(messages.deviceLogs)})
                      </button>
                    </Tooltip>
                  )}
                </span>
              }
              description={device.getIn(['deviceType', 'name'])}
              to={() => {
                addFilter(
                  { ...deviceListFilter, deviceTypeId: device.getIn(['deviceType', 'id']) },
                  '/browse/device/list'
                )
                navigate('/browse/device/list')
              }}
            />
            <Summary
              title={
                <span>
                  {formatMessage(messages.approvalStatus)}
                  {canDecommission &&
                    (isDecommissioned ? (
                      canReactivateDevice ? (
                        <button
                          type="button"
                          className={styles.fieldAction}
                          onClick={() => setReactivateDialogOpen(true)}
                        >
                          ({formatMessage(detailMessages.reactivate)})
                        </button>
                      ) : (
                        <Tooltip title={formatMessage(detailMessages.cannotReactivateExplanation)} placement="right">
                          <span>
                            <button type="button" className={styles.fieldAction} disabled>
                              ({formatMessage(detailMessages.reactivate)})
                            </button>
                          </span>
                        </Tooltip>
                      )
                    ) : canDecommissionDevice ? (
                      <button
                        type="button"
                        className={styles.fieldAction}
                        onClick={() => setDecommissionDialogOpen(true)}
                      >
                        ({formatMessage(detailMessages.decommission)})
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.fieldAction}
                        onClick={() =>
                          toast.error(formatMessage(detailMessages.deviceMustHaveDeploymentToBeDecommissioned))
                        }
                      >
                        ({formatMessage(detailMessages.decommission)})
                      </button>
                    ))}
                </span>
              }
              description={formatMessage(messages[device.get('approvalStatusI18nKey')])}
            />
            <Summary
              title={formatMessage(messages.connectivity)}
              description={formatMessage(messages.lastSeen, {
                lastSeen: formatRelative(device.get('lastPingOn'), formatRelativeTime),
              })}
            />
            <Summary title={formatMessage(messages.customNamePart)} description={device.get('customNamePart')} />

            {/* ── Capacity & Modules (GeneXpert only) ── */}
            {device.getIn(['deviceType', 'externalId']) === CONSTS.GENEXPERT_EXTERNAL_ID && (
              <>
                <SectionDivider label={formatMessage(messages.sectionCapacityModules)} />
                <Summary
                  title={formatMessage(messages.gx6cModulesCount)}
                  description={device.get('gx6cModulesCount') ?? '0'}
                />
                <Summary
                  title={formatMessage(messages.gx10cModulesCount)}
                  description={device.get('gx10cModulesCount') ?? '0'}
                />
                <Summary
                  title={formatMessage(messages.moduleBayCapacity)}
                  description={device.get('moduleBayCapacity')}
                />
              </>
            )}

            {/* ── Maintenance ── */}
            <SectionDivider label={formatMessage(messages.sectionMaintenance)} />
            <Summary
              title={
                isMaintenanceStatusChangeDisabled ? (
                  <AspectTooltip
                    className={styles.deviceSummary__container}
                    iconClass={styles.deviceSummary__helpIcon}
                    showHelpIcon
                    title={formatMessage(messages.deviceStatusChangeDisabledTooltip)}
                  >
                    <span>
                      {formatMessage(messages.maintenance)}
                      <button type="button" className={styles.fieldAction} disabled>
                        ({formatMessage(messages.buttonChange)})
                      </button>
                    </span>
                  </AspectTooltip>
                ) : (
                  <span>
                    {formatMessage(messages.maintenance)}
                    {!disabled && (
                      <button type="button" className={styles.fieldAction} onClick={onShowMaintenanceDialog}>
                        ({formatMessage(messages.buttonChange)})
                      </button>
                    )}
                  </span>
                )
              }
              description={
                <Fragment>
                  {maintenanceStatusText}
                  {maintenanceStatusNotes && (
                    <Tooltip title={maintenanceStatusNotes} placement="top" disableInteractive>
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
            />
            <Summary
              title={
                <span>
                  {formatMessage(messages.calibration)}
                  {!disabled && (
                    <button type="button" className={styles.fieldAction} onClick={onShowCalibrationDialog}>
                      ({formatMessage(messages.buttonAddRecord)})
                    </button>
                  )}
                </span>
              }
              description={
                <Fragment>
                  {formatMaintenanceDate(device.get('calibrationDate'))}
                  {calibrationNotes && (
                    <Tooltip title={calibrationNotes} placement="top" disableInteractive>
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
            />
            <Summary
              title={
                <span>
                  {formatMessage(messages.warranty)}
                  {!disabled && (
                    <button type="button" className={styles.fieldAction} onClick={onShowWarrantyDialog}>
                      ({formatMessage(messages.buttonUpdate)})
                    </button>
                  )}
                </span>
              }
              description={
                <Fragment>
                  {formatMaintenanceDate(device.get('warrantyDueDate'))}
                  {warrantyNotes && (
                    <Tooltip title={warrantyNotes} placement="bottom" disableInteractive>
                      <IconButton aria-label={formatMessage(messages.notes)}>
                        <NotesIcon fontSize="larger" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Fragment>
              }
            />
            <Summary
              title={formatMessage(messages.isDaisyChained)}
              description={device.get('isDaisyChained') ? 'True' : 'False'}
            />

            {/* ── Usage ── */}
            <SectionDivider label={formatMessage(messages.sectionUsage)} />
            {utilizationRateThisMonth !== null && (
              <Summary
                title={
                  <AspectTooltip
                    className={styles.deviceSummary__container}
                    iconClass={styles.deviceSummary__helpIcon}
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
                  className={styles.deviceSummary__container}
                  iconClass={styles.deviceSummary__helpIcon}
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
            <Summary title={formatMessage(messages.dailyCapacity)} description={device.get('dailyTestCapacity')} />

            {/* ── Technical Details ── */}
            <SectionDivider label={formatMessage(messages.sectionTechnicalDetails)} />
            <Summary title={formatMessage(messages.serial)} description={device.get('serial')} />
            <Summary title={formatMessage(messages.hostId)} description={device.get('hostId')} />
            <Summary title={formatMessage(messages.instrumentModel)} description={device.get('instrumentModel')} />
            <Summary title={formatMessage(messages.softwareType)} description={device.get('softwareType')} />
            <Summary
              title={formatMessage(messages.stickerInstrumentSerial)}
              description={device.get('stickerInstrumentSerial')}
            />

            {/* ── Additional Information ── */}
            <SectionDivider label={formatMessage(messages.sectionAdditionalInfo)} />
            <Summary
              title={formatMessage(messages.createdOn)}
              description={formatRelative(device.get('createdOn'), formatRelativeTime)}
            />
            <Summary title={formatMessage(messages.notes)} description={device.get('notes')} />
            <Summary title={formatMessage(messages.tags)} description={deviceTags.map(tag => tag.title).join(', ')} />
            <Summary
              title={formatMessage(messages.partner)}
              description={device.get('implementingPartnerName') ?? formatMessage(messages.undefinedValue)}
            />
            {canViewDakList && (
              <Summary
                title={formatMessage(messages.deviceApiKey)}
                description={device.get('maskedDeviceApiKey') ?? formatMessage(messages.undefinedValue)}
                to={
                  device.get('maskedDeviceApiKey')
                    ? () => {
                        addFilter(
                          { deviceApiKeyToken: device.get('maskedDeviceApiKey').slice(-9) },
                          '/browse/deviceApiKey'
                        )
                        navigate('/browse/deviceApiKey')
                      }
                    : undefined
                }
              />
            )}
            {isGeneXpertDevice && (
              <Summary
                title={formatMessage(messages.gxConnectInstallationId)}
                description={
                  device.getIn(['configurationData', 'gxConnectInstallationId']) ??
                  formatMessage(messages.undefinedValue)
                }
              />
            )}
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
        {showDecommissionButton && (
          <DecommissionDeviceDialog
            open={decommissionDialogOpen}
            onClose={() => setDecommissionDialogOpen(false)}
            deviceId={device.get('id')}
          />
        )}
        {showReactivateButton && (
          <ReactivateDeviceDialog
            open={reactivateDialogOpen}
            onClose={() => setReactivateDialogOpen(false)}
            deviceId={device.get('id')}
          />
        )}
      </section>

      <DeploymentsSection
        deviceId={device.get('id')}
        firstResultDate={device.get('firstResultEndedOn')}
        approvalToken={device.get('approvalToken')}
        disabled={disabled}
        deviceName={device.get('name')}
        deviceCustomNamePart={device.get('customNamePart')}
      />

      <PermissionChecker permissions={['admin:edit']}>
        {device.getIn(['deviceType', 'externalId']) === CONSTS.GENEXPERT_EXTERNAL_ID && (
          <DeviceInstrumentsTable deviceId={device.get('id')} disabled={disabled} />
        )}
      </PermissionChecker>
      <PerformanceReport
        performanceReport={devicePerformance}
        dailyCapacity={dailyCapacity || 0}
        location={location}
        culture={culture}
      />

      <PermissionChecker permissions={['result:view']}>
        <ErrorBoundary>
          <DeviceResultHistory
            deviceId={device.get('id')}
            sortDir={sortDir}
            sortCol={sortCol}
            pageAt={pageAt}
            pageSize={pageSize}
          />{' '}
        </ErrorBoundary>
      </PermissionChecker>
    </div>
  )
}

DeviceDetailProfile.propTypes = {
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
  disabled: PropTypes.bool.isRequired,
  canExportDeviceLogs: PropTypes.bool,
  devicePerformance: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
  onExportDeviceLogsClick: PropTypes.func.isRequired,
  deviceTags: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
    })
  ),
}

DeviceDetailProfile.defaultProps = {
  deviceTags: [],
  canExportDeviceLogs: false,
}

export default enhance(DeviceDetailProfile)
