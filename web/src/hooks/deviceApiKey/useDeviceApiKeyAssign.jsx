import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_API_KEY_KEY, DEVICE_KEY_ASSIGN_ENDPOINT } from './deviceApiKeyKeys.js'

const assignApiKey = async data => {
  return fetchWrapperForQueries({
    endpoint: DEVICE_KEY_ASSIGN_ENDPOINT,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const useDeviceApiKeyAssign = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => assignApiKey(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([DEVICE_API_KEY_KEY])
    },
  })

  return mutation
}

export default useDeviceApiKeyAssign
