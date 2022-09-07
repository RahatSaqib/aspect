import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { SITE_KEY, SITE_KEY_BY_ID_ENDPOINT } from './siteKeys.js'

const updateSiteById = async (site, siteId) => {
  const submitSite = { ...site }
  delete submitSite.id
  delete submitSite.country
  delete submitSite.createdOn
  delete submitSite.devices
  delete submitSite.lga
  delete submitSite.siteType
  delete submitSite.state
  delete submitSite.totalDevices
  delete submitSite.geographyId

  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(SITE_KEY_BY_ID_ENDPOINT, { siteId }),
    method: 'PUT',
    params: { ...submitSite },
  })
}

const useUpdateSite = siteId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => updateSiteById(data, siteId), {
    onSuccess: () => {
      queryClient.invalidateQueries([SITE_KEY, siteId])
      queryClient.invalidateQueries([SITE_KEY, 'list'])
      queryClient.invalidateQueries([SITE_KEY, 'table'])
    },
  })

  return mutation
}

export default useUpdateSite
