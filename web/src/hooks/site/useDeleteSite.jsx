import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { SITE_KEY, SITE_KEY_DELETE_BY_ID_ENDPOINT } from './siteKeys.js'

const deleteSiteById = async siteId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(SITE_KEY_DELETE_BY_ID_ENDPOINT, { siteId }),
    method: 'PUT',
    params: { siteId },
  })

const useDeleteSite = siteId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(() => deleteSiteById(siteId), {
    onSuccess: () => {
      queryClient.invalidateQueries([SITE_KEY, siteId])
      queryClient.invalidateQueries([SITE_KEY, 'list'])
      queryClient.invalidateQueries([SITE_KEY, 'table'])
    },
  })

  return mutation
}

export default useDeleteSite
