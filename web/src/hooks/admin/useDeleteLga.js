import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DELETE_ADMIN_LGA_ENDPOINT } from './adminKeys'
import { lgaDeleteErrors } from './errors'

export function useDeleteLga(options) {
  return useMutation(
    ({ lgaId }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(DELETE_ADMIN_LGA_ENDPOINT, { lgaId }),
        method: 'DELETE',
        customErrorNotifications: lgaDeleteErrors,
      }),
    { ...options }
  )
}
