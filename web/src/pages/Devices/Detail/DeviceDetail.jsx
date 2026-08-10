import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { useIntl } from 'react-intl'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DetailHeader, Loading } from '../../../components'
// import AspectVertMenu from '../../../components/AspectVertMenu'
import AspectButton from '../../../components/shared/AspectButton'
import useDevice from '../../../hooks/device/useDevice'
import useDevicePerformance from '../../../hooks/device/useDevicePerformance'
import useUpdateDeviceMaintenance from '../../../hooks/device/useUpdateDeviceMaintenance'
import useUpdateDeviceMaintenanceStatus from '../../../hooks/device/useUpdateDeviceMaintenanceStatus'
import useTagByTypeAndId from '../../../hooks/tag/useTagByTypeAndId'
import useAuthState from '../../../hooks/useAuthState'
import deviceMessages from '../../../messages/deviceMessages'
import isEditable from '../../../utils/selectors/isEditable'
import { getReturnUrl } from '../../../utils/utils/browser'
import DeviceDetailEdit from './Edit/DeviceDetailEdit'
import messages from './messages'
import DeviceDetailProfile from './Profile/DeviceDetailProfile'

export const DeviceDetail = props => {
  const user = useAuthState()
  const editable = isEditable(user, 'device')
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const navigate = useNavigate()
  const { deviceId } = useParams()
  const intl = useIntl()

  const { isLoading: isDeviceLoading, data: device } = useDevice(deviceId)
  const { isLoading: isDeviceTagsLoading, data: deviceTags } = useTagByTypeAndId('device', deviceId)
  const { isLoading: isDevicePerformanceLoading, data: devicePerformance } = useDevicePerformance(
    deviceId,
    searchParams
  )

  const isLoading = isDeviceLoading || isDeviceTagsLoading || isDevicePerformanceLoading
  const isDeviceNotFound = !isDeviceLoading && !device
  const isDecommissioned = device?.approvalToken === 'decommissioned'
  const editPath = `/browse/device/list/${deviceId}/edit${location.search}`

  const deviceTitle = useMemo(() => {
    if (!device) return 'Devices'

    const baseTitle = device.siteName
      ? intl.formatMessage(deviceMessages.nameAtSite, {
          deviceName: device.name,
          siteName: device.siteName,
        })
      : `${device.name} (${intl.formatMessage(messages.undeployed)})`

    return isDecommissioned ? `${baseTitle} ${intl.formatMessage(messages.decommissionedTitleSuffix)}` : baseTitle
  }, [device, intl, isDecommissioned])

  const { mutateAsync: updateMaintenanceStatus } = useUpdateDeviceMaintenanceStatus(deviceId)
  const { mutateAsync: updateMaintenance } = useUpdateDeviceMaintenance(deviceId)

  const onMaintenanceSubmit = values =>
    updateMaintenanceStatus({
      externalId: values.maintenanceStatus,
      notes: values.notes,
      expectedBackOnline: values.expectedBack,
    })
  const onCalibrationSubmit = values => updateMaintenance({ externalId: 'calibration', values })
  const onWarrantySubmit = values => updateMaintenance({ externalId: 'warranty', values })

  const dateRange = searchParams.get('dateRange') || '30'

  const onDateRangeChange = ({ target: { value: dateRange } }) => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('dateRange', dateRange)

    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
  }

  return (
    <>
      <DetailHeader
        responsive
        name={deviceTitle}
        back={location.state?.previousLocationPathname ?? getReturnUrl(location, '/browse/device/list')}
      >
        {[
          { label: intl.formatMessage(messages.profile), path: `/browse/device/list/${deviceId}${location.search}` },
          // A decommissioned device is read-only: its fields can no longer be edited.
          ...(isDecommissioned ? [] : [{ label: intl.formatMessage(messages.edit), path: editPath }]),
        ].map(({ label, path, disabled = false }) => (
          <AspectButton
            key={path}
            onClick={e => navigate(e.currentTarget.dataset.path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </DetailHeader>
      <Box component="main" sx={{ flex: '1 1 auto' }}>
        {isLoading ? (
          <Loading centered level={2} />
        ) : isDeviceNotFound ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={6}>
            <span>{intl.formatMessage(messages.deviceNotFound)}</span>
          </Box>
        ) : (
          <Routes>
            <Route
              path=""
              element={
                <DeviceDetailProfile
                  {...props}
                  dateRange={dateRange}
                  onDateRangeChange={onDateRangeChange}
                  device={device}
                  devicePerformance={devicePerformance}
                  // Decommissioned devices are read-only for every action except exporting Device Logs.
                  disabled={!editable || isDecommissioned}
                  canExportDeviceLogs={editable}
                  onMaintenanceSubmit={onMaintenanceSubmit}
                  onCalibrationSubmit={onCalibrationSubmit}
                  onWarrantySubmit={onWarrantySubmit}
                  deviceTags={deviceTags}
                />
              }
            />
            <Route
              path="edit"
              element={
                editable && !isDecommissioned ? (
                  <DeviceDetailEdit device={device} deviceTags={deviceTags} editable={editable} />
                ) : (
                  <Navigate replace to="." />
                )
              }
            />
          </Routes>
        )}
      </Box>
    </>
  )
}

export default DeviceDetail
