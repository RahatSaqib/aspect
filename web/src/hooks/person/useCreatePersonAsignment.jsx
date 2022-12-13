import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PERSON_KEY, PERSON_KEY_ASSIGNMENTS_CREATE } from './personKeys.js'

const createAssignment = async site => {
  const submitSite = { ...site }

  return fetchWrapperForQueries({
    endpoint: PERSON_KEY_ASSIGNMENTS_CREATE,
    method: 'POST',
    params: JSON.stringify(submitSite),
  })
}

const useCreatePersonAsignment = personId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => createAssignment(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([PERSON_KEY, 'person', 'assignment', personId])
    },
  })

  return mutation
}

export default useCreatePersonAsignment
