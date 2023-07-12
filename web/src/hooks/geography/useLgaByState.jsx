import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { LGA_KEY, LGA_KEY_BY_STATE_ID_ENDPOINT } from './geographyKeys.js'

const getLgaByStateId = async (stateId, returnAll) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(LGA_KEY_BY_STATE_ID_ENDPOINT, { stateId }),
    params: { all: returnAll },
  }).then(response => response.data)

const useLgaByState = ({ stateId, returnAll }, options) =>
  useQuery([LGA_KEY, stateId, returnAll], () => getLgaByStateId(stateId, returnAll), options)

export default useLgaByState
