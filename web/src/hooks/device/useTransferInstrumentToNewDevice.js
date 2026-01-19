import { useMutation, useQueryClient } from 'react-query'
import { aspectFetch } from '../../utils/utils/fetch'
import {
  CANDIDATE_INSTRUMENTS_KEY,
  DEVICE_INSTRUMENTS_KEY,
  DEVICE_KEY,
  DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT,
} from './deviceKeys.js'

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
      // Invalidate device list
      queryClient.invalidateQueries([DEVICE_KEY, 'list'])
      // Invalidate all device instruments queries (since we don't know the source deviceId)
      queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY])
      // Invalidate all candidate instruments queries
      queryClient.invalidateQueries([CANDIDATE_INSTRUMENTS_KEY])
    },
  })

  return mutation
}

export default useTransferInstrumentToNewDevice
