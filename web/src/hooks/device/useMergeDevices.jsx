import { useMutation, useQueryClient } from 'react-query'
import { DEVICE_KEY, DEVICE_KEY_MERGE_DEVICES_ENDPOINT } from './deviceKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const mergeDevices = async data => {
  return fetchWrapperForQueries({
    endpoint: DEVICE_KEY_MERGE_DEVICES_ENDPOINT,
    method: 'POST',
    params: { ...data },
  })
}

const useCreateSite = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => mergeDevices(data), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, 'list']),
  })

  return mutation
}

export default useCreateSite
