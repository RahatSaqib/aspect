import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { DEVICE_KEY, DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT } from './deviceKeys.js'

const transferInstruments = async data => {
  return fetchWrapperForQueries({
    endpoint: DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT,
    method: 'POST',
    params: { ...data },
  })
}

const useTransferInstruments = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => transferInstruments(data), {
    onSuccess: () => queryClient.invalidateQueries([DEVICE_KEY, 'list']),
  })

  return mutation
}

export default useTransferInstruments
