import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_LOGIN_DETAILS } from './personKeys'

const updateLogin = async (data, personId) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_LOGIN_DETAILS, { personId }),
    method: 'PUT',
    params: data,
  })

const useUpdatePersonLogin = personId => {
  const queryClient = useQueryClient()
  const mutation = useMutation(data => updateLogin(data, personId), {
    onSuccess: () => queryClient.invalidateQueries([PERSON_KEY, 'person', personId]),
  })
  return mutation
}

export default useUpdatePersonLogin
