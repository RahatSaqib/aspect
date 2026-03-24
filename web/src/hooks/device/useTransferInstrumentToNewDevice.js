import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT } from './deviceKeys.js'
import invalidateDeviceQueriesAfterInstrumentTransfer from './invalidateDeviceQueriesAfterInstrumentTransfer'

const transferInstrumentToNewDevice = async data => {
  return aspectFetch(DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const useTransferInstrumentToNewDevice = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => transferInstrumentToNewDevice(data), {
    onSuccess: data => {
      invalidateDeviceQueriesAfterInstrumentTransfer(queryClient, data)
    },
  })

  return mutation
}

export default useTransferInstrumentToNewDevice
