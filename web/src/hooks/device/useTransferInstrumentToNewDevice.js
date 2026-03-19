import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_KEY, DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT } from './deviceKeys.js'

const transferInstrumentToNewDevice = async data => {
  return aspectFetch(DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const useTransferInstrumentToNewDevice = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => transferInstrumentToNewDevice(data), {
    onSuccess: () => {
      // Invalidate device list + any device detail queries
      queryClient.invalidateQueries([DEVICE_KEY])
    },
  })

  return mutation
}

export default useTransferInstrumentToNewDevice
