import { useMutation, useQueryClient } from 'react-query'
import { SITE_KEY, SITE_KEY_BY_ID_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

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
    onSuccess: () => queryClient.invalidateQueries([SITE_KEY, siteId]),
  })

  return mutation
}

export default useUpdateSite
