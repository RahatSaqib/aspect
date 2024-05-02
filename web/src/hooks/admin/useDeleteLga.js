import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DELETE_ADMIN_LGA_ENDPOINT } from './adminKeys'

export function useDeleteLga(options) {
  return useMutation(
    ({ lgaId }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(DELETE_ADMIN_LGA_ENDPOINT, { lgaId }),
        method: 'DELETE',
      }),
    { ...options }
  )
}
