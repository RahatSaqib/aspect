import { useQuery } from 'react-query'
import { COUNTRY_KEY, LGA_KEY_BY_STATE_ID_ENDPOINT } from './geographyKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const getLgaByStateId = async stateId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(LGA_KEY_BY_STATE_ID_ENDPOINT, { stateId }),
  }).then(response => response.data)

const useLgaByState = (stateId, options) => useQuery([COUNTRY_KEY, stateId], () => getLgaByStateId(stateId), options)

export default useLgaByState
