import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { EDIT_ADMIN_STATE_ENDPOINT } from './adminKeys'

export function useEditState(options) {
  return useMutation(
    ({ stateId, abbreviation, name }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(EDIT_ADMIN_STATE_ENDPOINT, { stateId }),
        method: 'PUT',
        params: { abbreviation, name },
      }),
    { ...options }
  )
}
