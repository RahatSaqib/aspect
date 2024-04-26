import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { CREATE_ADMIN_STATE_ENDPOINT } from './adminKeys'

export function useCreateState(options) {
  return useMutation(
    ({ name, abbreviation }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(CREATE_ADMIN_STATE_ENDPOINT),
        method: 'POST',
        params: { name, abbreviation },
      }),
    { ...options }
  )
}
