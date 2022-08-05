import { useMutation, useQueryClient } from 'react-query'
import { SITE_KEY, SITE_KEY_DELETE_BY_ID_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

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
    },
  })

  return mutation
}

export default useDeleteSite
