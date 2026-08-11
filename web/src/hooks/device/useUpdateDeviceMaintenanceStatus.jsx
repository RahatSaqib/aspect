import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_MAINTENANCE_STATUS_BY_PERIOD } from '../../components/QueryFetch/Device'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { errorPleaseTryAgainInAFewMinutes } from '../../utils/error/CommonErrorNotifications'
import { DEVICE_KEY, DEVICE_MAINTENANCE_STATUS_ENDPOINT } from './deviceKeys'

const errorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.updateDeviceMaintenance.maintenance.POST.default.title',
    defaultMessage: 'Setting Maintenance Status Failed',
  },
})

const updateDeviceMaintenanceStatus = ({ deviceId, externalId, notes, expectedBackOnline }) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_MAINTENANCE_STATUS_ENDPOINT, { deviceId }),
    method: 'POST',
    params: { externalId, notes, expectedBackOnline },
    customErrorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(errorMessages),
      ...DEVICE_MAINTENANCE_STATUS_BY_PERIOD.ERRORS,
    },
  })

const useUpdateDeviceMaintenanceStatus = deviceId => {
  const queryClient = useQueryClient()

  return useMutation(values => updateDeviceMaintenanceStatus({ ...values, deviceId }), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, deviceId]),
  })
}

export default useUpdateDeviceMaintenanceStatus
