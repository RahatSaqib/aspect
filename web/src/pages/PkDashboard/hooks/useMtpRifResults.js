import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../components/QueryFetch'

export function useMtpRifResults(params) {
  return useQuery(
    ['mtb-rif-results', { endPointParams: [...params, { assay: 'GxMtbRif' }, { assay: 'GxMtbRifUltra' }] }],
    async ({ queryKey: [, { endPointParams }] }) =>
      fetchWrapperForQueries({ endpoint: '/result/current-result-aggregations', params: endPointParams })
  )
}
