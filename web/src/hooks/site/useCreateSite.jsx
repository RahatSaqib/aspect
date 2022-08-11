import { useMutation, useQueryClient } from 'react-query'
import { SITE_KEY, SITE_KEY_SITE_CREATE_ENDPOINT } from './siteKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const createSite = async site => {
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
    endpoint: SITE_KEY_SITE_CREATE_ENDPOINT,
    method: 'POST',
    params: { ...submitSite },
  })
}

const useCreateSite = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => createSite(data), {
    onSuccess: () => queryClient.invalidateQueries([SITE_KEY, 'list']),
  })

  return mutation
}

export default useCreateSite
