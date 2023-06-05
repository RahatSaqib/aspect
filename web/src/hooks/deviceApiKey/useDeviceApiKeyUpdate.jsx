import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_API_KEY_KEY, DEVICE_KEY_UPDATE_ENDPOINT } from './deviceApiKeyKeys.js'

const updateApiKey = async (deviceApiKeyId, data) => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(DEVICE_KEY_UPDATE_ENDPOINT, { deviceApiKeyId }),
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const useDeviceApiKeyUpdate = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation((deviceApiKeyId, data) => updateApiKey(deviceApiKeyId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries([DEVICE_API_KEY_KEY])
    },
  })

  return mutation
}

export default useDeviceApiKeyUpdate
