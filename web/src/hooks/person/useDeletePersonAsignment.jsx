import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_ASSIGNMENTS_DELETE } from './personKeys.js'

const deleteAsignment = async (personId, jobContextId) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_ASSIGNMENTS_DELETE, { personId, jobContextId }),
    method: 'DELETE',
  })

const useDeletePersonAsignment = personId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(jobContextId => deleteAsignment(personId, jobContextId), {
    onSuccess: () => {
      queryClient.invalidateQueries([PERSON_KEY, 'person', 'assignment', personId])
    },
  })

  return mutation
}

export default useDeletePersonAsignment
