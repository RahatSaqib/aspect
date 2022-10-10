import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { inlineWarning, errorPleaseTryAgainInAFewMinutes } from '../../utils/error/CommonErrorNotifications'
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
    customErrorNotifications: {
      409: inlineWarning(
        defineMessages({
          siteNameRepeated: {
            id: 'errorResponseMessages.updateSite.PUT.409.siteNameRepeated',
            defaultMessage: 'Site name is already in use',
          },
          siteShortNameRepeated: {
            id: 'errorResponseMessages.updateSite.PUT.409.siteShortNameRepeated',
            defaultMessage: 'Short name is already in use',
          },
          siteIdRepeated: {
            id: 'errorResponseMessages.updateSite.PUT.409.siteIdRepeated',
            defaultMessage: 'Site Id is already in use',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.updateSite.PUT.default.title',
            defaultMessage: 'Saving Site Failed',
          },
        })
      ),
    },
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
