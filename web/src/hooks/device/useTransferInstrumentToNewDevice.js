import { useMutation, useQueryClient } from 'react-query'
import { DEVICE_LIST } from '../../components/QueryFetch/Device'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_INSTRUMENTS_KEY, DEVICE_KEY_TRANSFER_INSTRUMENT_TO_NEW_DEVICE_ENDPOINT } from './deviceKeys.js'

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
      queryClient.invalidateQueries([DEVICE_LIST.KEY])
      queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY])
    },
  })

  return mutation
}

export default useTransferInstrumentToNewDevice
