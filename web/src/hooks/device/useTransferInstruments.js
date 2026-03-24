import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT } from './deviceKeys.js'
import invalidateDeviceQueriesAfterInstrumentTransfer from './invalidateDeviceQueriesAfterInstrumentTransfer'

const transferInstruments = async data => {
  return aspectFetch(DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ ...data }),
  })
}

const useTransferInstruments = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => transferInstruments(data), {
    onSuccess: data => {
      invalidateDeviceQueriesAfterInstrumentTransfer(queryClient, data)
    },
  })

  return mutation
}

export default useTransferInstruments
