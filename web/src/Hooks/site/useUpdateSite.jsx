import { useMutation, useQueryClient } from 'react-query'
import { SITE_KEY, SITE_KEY_BY_ID_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const updateSiteById = async (site, siteId) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(SITE_KEY_BY_ID_ENDPOINT, { siteId }),
    method: 'PUT',
    params: {
      name: site.name,
      shortName: site.shortName,
      externalId: site.externalId,
      timezone: site.timezone,
      countryId: site.countryId,
      stateId: site.stateId,
      lgaId: site.lgaId,
      street1: site.street1,
      street2: site.street2,
      city: site.city,
      zip: site.zip,
      latitude: site.latitude,
      longitude: site.longitude,
    },
  })

const useUpdateSite = siteId => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => updateSiteById(data, siteId), {
    onSuccess: () => queryClient.invalidateQueries([SITE_KEY, siteId]),
  })

  return mutation
}

export default useUpdateSite
