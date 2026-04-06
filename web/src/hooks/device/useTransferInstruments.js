import { useMutation, useQueryClient } from 'react-query'
import { DEVICE_LIST } from '../../components/QueryFetch/Device'
import { aspectFetch } from '../../utils/utils/fetch'
import { DEVICE_INSTRUMENTS_KEY, DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT } from './deviceKeys.js'

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
      queryClient.invalidateQueries([DEVICE_LIST.KEY])
      queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY])
    },
  })

  return mutation
}

export default useTransferInstruments
