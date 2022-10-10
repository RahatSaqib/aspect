import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { inlineWarning, errorPleaseTryAgainInAFewMinutes } from '../../utils/error/CommonErrorNotifications'
import { SITE_KEY, SITE_KEY_SITE_ENDPOINT } from './siteKeys.js'

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
    endpoint: SITE_KEY_SITE_ENDPOINT,
    method: 'POST',
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

const useCreateSite = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => createSite(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([SITE_KEY, 'list'])
      queryClient.invalidateQueries([SITE_KEY, 'table'])
    },
  })

  return mutation
}

export default useCreateSite
