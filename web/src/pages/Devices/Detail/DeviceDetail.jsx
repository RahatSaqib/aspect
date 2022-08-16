import React, { useCallback } from 'react'
// import PropTypes from 'prop-types'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import { useDispatch } from 'react-redux'
import { defineMessages } from 'react-intl'

import { Routes, Navigate, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'

import { useAuthState } from '../../../providers/AuthProvider'
import isEditable from '../../../utils/selectors/isEditable'
import { DelayShowingProgressCircular } from '../../../oldComponents/shared/DelayShowingProgressBar'
import DeviceDetailProfile from './Profile/DeviceDetailProfile'
import DeviceDetailOperation from './Operation/DeviceDetailOperation'
import DeviceDetailAlerts from './Alerts/DeviceDetailAlerts'
import DeviceDetailEdit from './Edit/DeviceDetailEdit'

import { Shell, ShellHeader, ShellContent } from '../../../components/Shell'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { DEVICE_DETAIL, DEVICE_PERFORMANCE } from '../../../components/QueryFetch/Device/index'
import { updateSingleDevice, updateDeviceMaintenanceStatus, updateDeviceMaintenance } from '../../../store/DeviceRedux'

import styles from './DeviceDetail.css'
import useI18n from '../../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  profile: {
    id: 'pages.DeviceDetail.profile',
    defaultMessage: 'Profile',
  },
  operation: {
    id: 'pages.DeviceDetail.operation',
    defaultMessage: 'Operation',
  },
  alerts: {
    id: 'pages.DeviceDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.DeviceDetail.edit',
    defaultMessage: 'Edit',
  },
})

export const DeviceDetail = props => {
  const dispatch = useDispatch()
  const user = useAuthState()
  const editable = isEditable(user, 'device')
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const navigate = useNavigate()
  const { deviceId } = useParams()
  const intl = useI18n()
  const queryClient = useQueryClient()

  const { data: { device = {}, devicePerformance = {} } = {}, isLoading } = useQuery(
    [DEVICE_DETAIL.KEY, { deviceId }],
    async () => {
      const { data: device = false } = await fetchWrapperForQueries({
        endpoint: `${DEVICE_DETAIL.ENDPOINT}/${deviceId}`,
      })
      const devicePerformance = await fetchWrapperForQueries({
        endpoint: `${DEVICE_PERFORMANCE.ENDPOINT}/${deviceId}`,
        params: searchParams,
      })
      return { device, devicePerformance }
    }
  )

  // onSuccess - reset key to re-run query for device
  const onSuccess = useCallback(() => {
    queryClient.invalidateQueries([DEVICE_DETAIL.KEY, { deviceId }])
  }, [deviceId, queryClient])

  const { mutate: updateDevice } = useMutation(({ deviceId, data }) => dispatch(updateSingleDevice(deviceId, data)), {
    onSuccess,
  })

  const { mutate: onMaintenanceSubmit } = useMutation(
    values =>
      dispatch(
        updateDeviceMaintenanceStatus({
          externalId: values.maintenanceStatus,
          device: Immutable.fromJS(device),
          notes: values.notes,
        })
      ),
    {
      onSuccess,
    }
  )
  const { mutate: onCalibrationSubmit } = useMutation(
    values =>
      dispatch(
        updateDeviceMaintenance({
          externalId: 'calibration',
          device: Immutable.fromJS(device),
          values,
        })
      ),
    {
      onSuccess,
    }
  )
  const { mutate: onWarrantySubmit } = useMutation(
    values =>
      dispatch(
        updateDeviceMaintenance({
          externalId: 'warranty',
          device: Immutable.fromJS(device),
          values,
        })
      ),
    {
      onSuccess,
    }
  )

  const dateRange = searchParams.get('dateRange') || '30'

  const onDateRangeChange = ({ target: { value: dateRange } }) => {
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('dateRange', dateRange)

    navigate(
      {
        ...location,
        search: `?${searchParams.toString()}`,
      },
      { replace: true }
    )
  }

  return (
    <Shell>
      <ShellHeader title={device.name ? device.name : 'Devices'}>
        {[
          {
            label: intl.formatMessage(messages.profile),
            path: `/browse/device/${deviceId}`,
          },
          {
            label: intl.formatMessage(messages.alerts),
            path: `/browse/device/${deviceId}/alerts`,
          },
          {
            label: intl.formatMessage(messages.edit),
            path: `/browse/device/${deviceId}/edit`,
          },
        ].map(({ label, path, disabled = false }) => (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => navigate(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </ShellHeader>
      <ShellContent>
        {device.id && (
          <Routes>
            <Route path="">
              <DeviceDetailProfile
                {...props}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
                device={Immutable.fromJS(device)}
                devicePerformance={Immutable.fromJS(devicePerformance)}
                disabled={!editable}
                updateSingleDevice={updateDevice}
                onMaintenanceSubmit={onMaintenanceSubmit}
                onCalibrationSubmit={onCalibrationSubmit}
                onWarrantySubmit={onWarrantySubmit}
              />
            </Route>
            <Route path="operation">
              <DeviceDetailOperation intl={intl} {...props} device={Immutable.fromJS(device)} disabled={!editable} />
            </Route>
            <Route path="alerts">
              <DeviceDetailAlerts intl={intl} {...props} device={Immutable.fromJS(device)} disabled={!editable} />
            </Route>
            <Route path="edit">
              {editable ? (
                <DeviceDetailEdit
                  {...props}
                  device={Immutable.fromJS(device)}
                  editable={editable}
                  updateSingleDevice={updateDevice}
                />
              ) : (
                <Navigate replace to="." />
              )}
            </Route>
          </Routes>
        )}
        {isLoading && (
          <DelayShowingProgressCircular
            className={cssClasses('DelayShowingProgressCircular')}
            disabled={false}
            variant="indeterminate"
          />
        )}
      </ShellContent>
    </Shell>
  )
}

// DeviceDetail.propTypes = {
//   match: PropTypes.oneOfType([PropTypes.object]).isRequired,
// }

export default DeviceDetail
