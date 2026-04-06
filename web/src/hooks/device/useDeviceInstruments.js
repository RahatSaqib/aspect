import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DEVICE_INSTRUMENTS_KEY } from './deviceKeys.js'

const DEVICE_INSTRUMENTS_ENDPOINT = '/device/:deviceId/instruments'

const getDeviceInstruments = async deviceId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(DEVICE_INSTRUMENTS_ENDPOINT, { deviceId }) }).then(
    response => response.data.instruments
  )

const useDeviceInstruments = deviceId =>
  useQuery([DEVICE_INSTRUMENTS_KEY, deviceId], () => getDeviceInstruments(deviceId))

export default useDeviceInstruments
