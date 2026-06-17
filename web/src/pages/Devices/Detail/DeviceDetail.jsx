import React from 'react'
import { Box } from '@mui/material'
import Immutable from 'immutable'
import { defineMessages, useIntl } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import { Routes, Navigate, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { DetailHeader, Loading } from '../../../components'
// import AspectVertMenu from '../../../components/AspectVertMenu'
import AspectButton from '../../../components/shared/AspectButton'
import { DEVICE_KEY } from '../../../hooks/device/deviceKeys'
import useDevice from '../../../hooks/device/useDevice'
import useDevicePerformance from '../../../hooks/device/useDevicePerformance'
import useTagByTypeAndId from '../../../hooks/tag/useTagByTypeAndId'
import useAuthState from '../../../hooks/useAuthState'
import deviceMessages from '../../../messages/deviceMessages'
import { updateDeviceMaintenanceStatus, updateDeviceMaintenance } from '../../../store/DeviceRedux'
import isEditable from '../../../utils/selectors/isEditable'
import { getReturnUrl } from '../../../utils/utils/browser'
import DeviceDetailEdit from './Edit/DeviceDetailEdit'
import DeviceDetailProfile from './Profile/DeviceDetailProfile'

const messages = defineMessages({
  profile: { id: 'pages.DeviceDetail.profile', defaultMessage: 'Profile' },
  operation: { id: 'pages.DeviceDetail.operation', defaultMessage: 'Operation' },
  alerts: { id: 'pages.DeviceDetail.alerts', defaultMessage: 'Alerts' },
  edit: { id: 'pages.DeviceDetail.edit', defaultMessage: 'Edit' },
  deviceNotFound: { id: 'pages.DeviceDetail.deviceNotFound', defaultMessage: 'Device not found.' },
  undeployed: { id: 'pages.DeviceDetail.undeployed', defaultMessage: 'Undeployed' },
})

export const DeviceDetail = props => {
  const dispatch = useDispatch()
  const user = useAuthState()
  const editable = isEditable(user, 'device')
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const navigate = useNavigate()
  const { deviceId } = useParams()
  const intl = useIntl()
  const queryClient = useQueryClient()

  const { isLoading: isDeviceLoading, data: device } = useDevice(deviceId)
  const { isLoading: isDeviceTagsLoading, data: deviceTags } = useTagByTypeAndId('device', deviceId)
  const { isLoading: isDevicePerformanceLoading, data: devicePerformance } = useDevicePerformance(
    deviceId,
    searchParams
  )

  const isLoading = isDeviceLoading || isDeviceTagsLoading || isDevicePerformanceLoading
  const isDeviceNotFound = !isDeviceLoading && !device

  // onSuccess - reset key to re-run query for device
  const onSuccess = () => queryClient.invalidateQueries([DEVICE_KEY, deviceId])

  const { mutateAsync: onMaintenanceSubmit } = useMutation(
    values =>
      dispatch(
        updateDeviceMaintenanceStatus({
          externalId: values.maintenanceStatus,
          device: Immutable.fromJS(device),
          notes: values.notes,
          expectedBackOnline: values.expectedBack,
        })
      ),
    { onSuccess }
  )
  const { mutateAsync: onCalibrationSubmit } = useMutation(
    values =>
      dispatch(updateDeviceMaintenance({ externalId: 'calibration', device: Immutable.fromJS(device), values })),
    { onSuccess }
  )
  const { mutateAsync: onWarrantySubmit } = useMutation(
    values => dispatch(updateDeviceMaintenance({ externalId: 'warranty', device: Immutable.fromJS(device), values })),
    { onSuccess }
  )

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
        name={
          device
            ? device.siteName
              ? intl.formatMessage(deviceMessages.nameAtSite, {
                  deviceName: device.name,
                  siteName: device.siteName,
                })
              : `${device.name} (${intl.formatMessage(messages.undeployed)})`
            : 'Devices'
        }
        back={location.state?.previousLocationPathname ?? getReturnUrl(location, '/browse/device/list')}
      >
        {[
          { label: intl.formatMessage(messages.profile), path: `/browse/device/list/${deviceId}${location.search}` },
          { label: intl.formatMessage(messages.edit), path: `/browse/device/list/${deviceId}/edit${location.search}` },
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
                  device={Immutable.fromJS(device)}
                  devicePerformance={Immutable.fromJS(devicePerformance)}
                  disabled={!editable}
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
                editable ? (
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
