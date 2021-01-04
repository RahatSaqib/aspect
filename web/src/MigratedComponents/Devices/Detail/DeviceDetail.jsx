import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
import { defineMessages, useIntl } from 'react-intl'

import {
  Switch,
  Redirect,
  Route,
  useHistory,
  useParams,
  useLocation,
} from 'react-router-dom'
import { useQuery, useMutation, queryCache } from 'react-query'
import isEditable from '../../../shared/selectors/isEditable'
import { DelayShowingProgressCircular } from '../../../components/shared/DelayShowingProgressBar'
import DeviceDetailProfile from './Profile/DeviceDetailProfile'
import DeviceDetailOperation from './Operation/DeviceDetailOperation'
import DeviceDetailAlerts from './Alerts/DeviceDetailAlerts'
import DeviceDetailEdit from './Edit/DeviceDetailEdit'

import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import AspectButton from '../../../components/shared/AspectButton'
import fetchWrapperForQueries from '../../QueryFetch/index'
import {
  DEVICE_DETAIL,
  DEVICE_PERFORMANCE,
} from '../../QueryFetch/Device/index'
import {
  updateDeviceMaintenanceStatus,
  updateDeviceMaintenance,
} from '../../../device/DeviceRedux'

const cssClasses = classnames.bind(require('./DeviceDetail.css'))

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

export const DeviceDetail = ({ match }) => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const editable = isEditable(user, 'device')
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const history = useHistory()
  const { deviceId } = useParams()
  const intl = useIntl()

  const {
    data: { device = {}, devicePerformance = {} } = {},
    isLoading,
  } = useQuery([DEVICE_DETAIL.KEY, { deviceId }], async () => {
    const { data: device = false } = await fetchWrapperForQueries({
      endpoint: `${DEVICE_DETAIL.ENDPOINT}/${deviceId}`,
    })
    const devicePerformance = await fetchWrapperForQueries({
      endpoint: `${DEVICE_PERFORMANCE.ENDPOINT}/${deviceId}`,
      params: searchParams,
    })
    return { device, devicePerformance }
  })

  const [updateSingleDevice] = useMutation(data =>
    fetchWrapperForQueries({
      endpoint: `${DEVICE_PERFORMANCE.ENDPOINT}/${deviceId}`,
      method: 'PUT',
      params: data,
    })
  )

  // onSuccess - reset key to re-run query for device
  const onSuccess = useCallback(() => {
    queryCache.invalidateQueries([DEVICE_DETAIL.KEY, { deviceId }])
  }, [deviceId])

  //
  const [onMaintenanceSubmit] = useMutation(
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
  const [onCalibrationSubmit] = useMutation(
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
  const [onWarrantySubmit] = useMutation(
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

    history.replace({
      ...location,
      search: searchParams.toString(),
    })
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
            }) => history.push(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== history?.location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </ShellHeader>
      <ShellContent>
        {device.id && (
          <Switch>
            <Route
              exact
              path={match.path}
              render={props => (
                <DeviceDetailProfile
                  {...props}
                  dateRange={dateRange}
                  onDateRangeChange={onDateRangeChange}
                  device={Immutable.fromJS(device)}
                  devicePerformance={Immutable.fromJS(devicePerformance)}
                  disabled={!editable}
                  updateSingleDevice={updateSingleDevice}
                  onMaintenanceSubmit={onMaintenanceSubmit}
                  onCalibrationSubmit={onCalibrationSubmit}
                  onWarrantySubmit={onWarrantySubmit}
                />
              )}
            />
            <Route
              exact
              path={`${match.path}/operation`}
              render={props => (
                <DeviceDetailOperation
                  intl={intl}
                  {...props}
                  device={Immutable.fromJS(device)}
                  disabled={!editable}
                />
              )}
            />
            <Route
              exact
              path={`${match.path}/alerts`}
              render={props => (
                <DeviceDetailAlerts
                  intl={intl}
                  {...props}
                  device={Immutable.fromJS(device)}
                  disabled={!editable}
                />
              )}
            />
            <Route
              exact
              path={`${match.path}/edit`}
              render={props =>
                editable ? (
                  <DeviceDetailEdit
                    {...props}
                    device={Immutable.fromJS(device)}
                    editable={editable}
                    updateSingleDevice={updateSingleDevice}
                  />
                ) : (
                  <Redirect to={match.url} />
                )
              }
            />
          </Switch>
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

DeviceDetail.propTypes = {
  match: PropTypes.oneOf([PropTypes.object]).isRequired,
}

export default DeviceDetail
