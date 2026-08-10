import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { errorPleaseTryAgainInAFewMinutes } from '../../utils/error/CommonErrorNotifications'
import { DEVICE_KEY, DEVICE_MAINTENANCE_ENDPOINT } from './deviceKeys'

const calibrationErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.updateDeviceMaintenance.calibration.POST.default.title',
    defaultMessage: 'Setting Device Calibration Date Failed',
  },
})

const warrantyErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.updateDeviceMaintenance.warranty.POST.default.title',
    defaultMessage: 'Setting Device Warranty Due Date Failed',
  },
})

const updateDeviceMaintenance = ({ deviceId, externalId, values }) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_MAINTENANCE_ENDPOINT, { deviceId }),
    method: 'POST',
    params: { ...values, externalId },
    customErrorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(
        externalId === 'calibration' ? calibrationErrorMessages : warrantyErrorMessages
      ),
    },
  })

const useUpdateDeviceMaintenance = deviceId => {
  const queryClient = useQueryClient()

  return useMutation(({ externalId, values }) => updateDeviceMaintenance({ deviceId, externalId, values }), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, deviceId]),
  })
}

export default useUpdateDeviceMaintenance
