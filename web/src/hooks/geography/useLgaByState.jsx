import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { LGA_KEY, LGA_KEY_BY_STATE_ID_ENDPOINT } from './geographyKeys.js'

const getLgaByStateId = async stateId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(LGA_KEY_BY_STATE_ID_ENDPOINT, { stateId }),
  }).then(response => response.data)

const useLgaByState = (stateId, options) => useQuery([LGA_KEY, stateId], () => getLgaByStateId(stateId), options)

export default useLgaByState
