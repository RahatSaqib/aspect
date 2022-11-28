import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PERSON_KEY, PERSON_SELF } from './personKeys'

const updateSelf = async data => fetchWrapperForQueries({ endpoint: PERSON_SELF, method: 'PUT', params: data })

const useUpdateSelf = id => {
  const queryClient = useQueryClient()
  const mutation = useMutation(data => updateSelf(data), {
    onSuccess: () => queryClient.invalidateQueries([PERSON_KEY, 'person', id]),
  })
  return mutation
}

export default useUpdateSelf
