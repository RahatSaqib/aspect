import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_BY_ID } from './personKeys'

const updatePerson = async (data, personId) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_BY_ID, { personId }),
    method: 'PUT',
    params: data,
  })

const useUpdatePerson = personId => {
  const queryClient = useQueryClient()
  const mutation = useMutation(data => updatePerson(data, personId), {
    onSuccess: () => queryClient.invalidateQueries([PERSON_KEY, 'person', personId]),
  })
  return mutation
}

export default useUpdatePerson
