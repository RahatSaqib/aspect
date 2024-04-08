import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { EDIT_ADMIN_LGA_ENDPOINT } from './adminKeys'

export function useEditLga() {
  return useMutation(({ stateId, lgaId }) =>
    fetchWrapperForQueries({
      endpoint: replaceRouteParams(EDIT_ADMIN_LGA_ENDPOINT, { lgaId }),
      method: 'PUT',
      params: { stateId },
    })
  )
}
