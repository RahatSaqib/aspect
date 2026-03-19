import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_KEY, DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT } from './deviceKeys.js'

const transferInstruments = async data => {
  return aspectFetch(DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ ...data }),
  })
}

const useTransferInstruments = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => transferInstruments(data), {
    onSuccess: () => {
      // Invalidate device list + any device detail queries (e.g. currently open device page)
      queryClient.invalidateQueries([DEVICE_KEY])
    },
  })

  return mutation
}

export default useTransferInstruments
