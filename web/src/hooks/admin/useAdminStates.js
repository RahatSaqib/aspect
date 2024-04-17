import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { ADMIN_STATES_ENDPOINT, ADMIN_STATES_KEYS } from './adminKeys'

export function useAdminStates(params) {
  return useQuery(
    [ADMIN_STATES_KEYS, params],
    () => fetchWrapperForQueries({ endpoint: ADMIN_STATES_ENDPOINT, params }),
    {
      ...SELECTS_QUERY_OPTIONS,
    }
  )
}
