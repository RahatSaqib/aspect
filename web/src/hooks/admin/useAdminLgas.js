import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { ADMIN_LGAS_ENDPOINT, ADMIN_LGAS_KEYS } from './adminKeys'

export function useAdminLgas(params) {
  return useQuery([ADMIN_LGAS_KEYS, params], () => fetchWrapperForQueries({ endpoint: ADMIN_LGAS_ENDPOINT, params }), {
    ...SELECTS_QUERY_OPTIONS,
  })
}
