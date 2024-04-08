import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { CREATE_ADMIN_LGA_ENDPOINT } from './adminKeys'

export function useCreateLga() {
  return useMutation(({ stateId, name }) =>
    fetchWrapperForQueries({
      endpoint: replaceRouteParams(CREATE_ADMIN_LGA_ENDPOINT),
      method: 'POST',
      params: { name, stateId },
    })
  )
}
