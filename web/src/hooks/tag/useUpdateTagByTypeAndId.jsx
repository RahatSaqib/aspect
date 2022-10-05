import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { TAG_KEY, TAG_KEY_BY_TYPE_AND_ID_ENDPOINT } from './tagKeys'

const updateTagByTypeAndId = async (tags, type, id) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(TAG_KEY_BY_TYPE_AND_ID_ENDPOINT, { type, id }),
    method: 'PUT',
    params: { tags },
  })

const useUpdateTagByTypeAndId = (type, id) => {
  const queryClient = useQueryClient()
  const mutation = useMutation(data => updateTagByTypeAndId(data, type, id), {
    onSuccess: () => queryClient.invalidateQueries([TAG_KEY, type, id]),
  })
  return mutation
}

export default useUpdateTagByTypeAndId
