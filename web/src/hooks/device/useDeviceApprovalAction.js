import { useMutation, useQueryClient } from 'react-query'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_APPROVAL_ACTION_ENDPOINT, DEVICE_DEPLOYMENTS_KEY, DEVICE_KEY } from './deviceKeys'

const runDeviceApprovalAction = async ({ deviceId, action }) => {
  const endpoint = replaceRouteParams(DEVICE_APPROVAL_ACTION_ENDPOINT, { deviceId })
  return aspectFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

const useDeviceApprovalAction = () => {
  const queryClient = useQueryClient()

  return useMutation(runDeviceApprovalAction, {
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === DEVICE_KEY && String(query.queryKey[1]) === String(deviceId),
      })
      queryClient.invalidateQueries([DEVICE_DEPLOYMENTS_KEY, deviceId])
    },
  })
}

export default useDeviceApprovalAction
