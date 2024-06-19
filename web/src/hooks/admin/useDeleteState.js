import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DELETE_ADMIN_STATE_ENDPOINT } from './adminKeys'
import { stateDeleteErrors } from './errors'

export function useDeleteState(options) {
  return useMutation(
    ({ stateId }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(DELETE_ADMIN_STATE_ENDPOINT, { stateId }),
        method: 'DELETE',
        customErrorNotifications: stateDeleteErrors,
      }),
    { ...options }
  )
}
