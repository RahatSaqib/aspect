import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import {
  DEVICE_KEY,
  DEVICE_KEY_TRANSFER_INSTRUMENTS_ENDPOINT,
  DEVICE_INSTRUMENTS_KEY,
  CANDIDATE_INSTRUMENTS_KEY,
} from './deviceKeys.js'

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
    onSuccess: (_, variables) => {
      const { targetDeviceId } = variables
      // Invalidate device list
      queryClient.invalidateQueries([DEVICE_KEY, 'list'])
      // Invalidate device instruments for target device
      queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY, targetDeviceId])
      // Invalidate candidate instruments for target device
      queryClient.invalidateQueries([CANDIDATE_INSTRUMENTS_KEY, targetDeviceId])
      // Also invalidate candidate instruments for source devices
      if (variables.sourceInstrumentsData && Array.isArray(variables.sourceInstrumentsData)) {
        const sourceDeviceIds = [...new Set(variables.sourceInstrumentsData.map(item => item.deviceId))]
        sourceDeviceIds.forEach(sourceDeviceId => {
          queryClient.invalidateQueries([CANDIDATE_INSTRUMENTS_KEY, sourceDeviceId])
          queryClient.invalidateQueries([DEVICE_INSTRUMENTS_KEY, sourceDeviceId])
        })
      }
    },
  })

  return mutation
}

export default useTransferInstruments
