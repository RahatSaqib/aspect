import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { CREATE_ADMIN_LGA_ENDPOINT } from './adminKeys'
import { lgaMutationErrors } from './errors'

export function useCreateLga(options) {
  return useMutation(
    ({ stateId, name }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(CREATE_ADMIN_LGA_ENDPOINT),
        method: 'POST',
        params: { name, stateId },
        customErrorNotifications: lgaMutationErrors,
      }),
    { ...options }
  )
}
