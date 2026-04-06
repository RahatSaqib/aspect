import React, { useState } from 'react'
import { Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import Immutable from 'immutable'
import { defineMessages, useIntl } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import { useDispatch } from 'react-redux'
import { Routes, Navigate, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { DetailHeader, Loading } from '../../../cleanComponents'
// import AspectVertMenu from '../../../components/AspectVertMenu'
import { DEVICE_KEY } from '../../../hooks/device/deviceKeys'
import useDevice from '../../../hooks/device/useDevice'
import useDeviceApprovalAction from '../../../hooks/device/useDeviceApprovalAction'
import useDevicePerformance from '../../../hooks/device/useDevicePerformance'
import useTagByTypeAndId from '../../../hooks/tag/useTagByTypeAndId'
import useAuthState from '../../../hooks/useAuthState'
import deviceApprovalMessages from '../../../messages/deviceApprovalMessages'
import deviceStatusMessages from '../../../messages/deviceStatusMessages'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import { updateDeviceMaintenanceStatus, updateDeviceMaintenance } from '../../../store/DeviceRedux'
import isEditable from '../../../utils/selectors/isEditable'
import { getReturnUrl } from '../../../utils/utils/browser'
import DeviceDetailEdit from './Edit/DeviceDetailEdit'
import DeviceDetailProfile from './Profile/DeviceDetailProfile'

const messages = {
  ...deviceApprovalMessages,
  ...deviceStatusMessages,
  ...defineMessages({
    profile: { id: 'pages.DeviceDetail.profile', defaultMessage: 'Profile' },
    operation: { id: 'pages.DeviceDetail.operation', defaultMessage: 'Operation' },
    alerts: { id: 'pages.DeviceDetail.alerts', defaultMessage: 'Alerts' },
    edit: { id: 'pages.DeviceDetail.edit', defaultMessage: 'Edit' },
    decommissionDevice: { id: 'pages.DeviceDetail.decommissionDevice', defaultMessage: 'Decommission device' },
    reactivateDevice: { id: 'pages.DeviceDetail.reactivateDevice', defaultMessage: 'Reactivate device' },
    decommissionConfirmTitle: {
      id: 'pages.DeviceDetail.decommissionConfirmTitle',
      defaultMessage: 'Decommission device',
    },
    decommissionConfirmMessage: {
      id: 'pages.DeviceDetail.decommissionConfirmMessage',
      defaultMessage: 'Are you sure you want to decommission this device?',
    },
    reactivateConfirmTitle: {
      id: 'pages.DeviceDetail.reactivateConfirmTitle',
      defaultMessage: 'Reactivate device',
    },
    reactivateConfirmMessage: {
      id: 'pages.DeviceDetail.reactivateConfirmMessage',
      defaultMessage: 'Are you sure you want to reactivate this device?',
    },
    cancel: { id: 'pages.DeviceDetail.cancel', defaultMessage: 'Cancel' },
    confirm: { id: 'pages.DeviceDetail.confirm', defaultMessage: 'Confirm' },
    deviceNotFound: { id: 'pages.DeviceDetail.deviceNotFound', defaultMessage: 'Device not found.' },
  }),
}

const APPROVAL_ACTIONS = {
  DECOMMISSION: 'decommission',
  REACTIVATE: 'reactivate',
}

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

  const { mutate: runDeviceApprovalAction } = useDeviceApprovalAction()
  const [pendingApprovalAction, setPendingApprovalAction] = useState(null)

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

  /*   const approvalActions =
    device && editable
      ? [
          {
            text: intl.formatMessage(
              device.approvalToken === 'decommissioned' ? messages.reactivateDevice : messages.decommissionDevice
            ),
            action: () =>
              setPendingApprovalAction(
                device.approvalToken === 'decommissioned' ? APPROVAL_ACTIONS.REACTIVATE : APPROVAL_ACTIONS.DECOMMISSION
              ),
          },
        ]
      : null */

  const handleConfirmApprovalAction = () => {
    if (!pendingApprovalAction) {
      return
    }

    runDeviceApprovalAction({
      deviceId,
      action: pendingApprovalAction,
    })
    setPendingApprovalAction(null)
  }

  const isApprovalDialogOpen = pendingApprovalAction !== null
  const approvalDialogTitle =
    pendingApprovalAction === APPROVAL_ACTIONS.REACTIVATE
      ? messages.reactivateConfirmTitle
      : messages.decommissionConfirmTitle
  const approvalDialogMessage =
    pendingApprovalAction === APPROVAL_ACTIONS.REACTIVATE
      ? messages.reactivateConfirmMessage
      : messages.decommissionConfirmMessage

  return (
    <>
      <DetailHeader
        name={device ? device.name : 'Devices'}
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
        {/* approvalActions ? <AspectVertMenu actions={approvalActions} /> : null */}
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
      <Dialog open={isApprovalDialogOpen} onClose={() => setPendingApprovalAction(null)}>
        <DialogTitle>{intl.formatMessage(approvalDialogTitle)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{intl.formatMessage(approvalDialogMessage)}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <AspectButton onClick={() => setPendingApprovalAction(null)}>
            {intl.formatMessage(messages.cancel)}
          </AspectButton>
          <AspectButton color="primary" variant="contained" onClick={handleConfirmApprovalAction}>
            {intl.formatMessage(messages.confirm)}
          </AspectButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DeviceDetail
