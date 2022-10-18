import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_BY_SITE_ID_ENDPOINT } from './personKeys.js'

const getContactsBySiteId = async siteId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_BY_SITE_ID_ENDPOINT, { siteId }),
  }).then(response => response.data)

const useContactBySite = siteId => useQuery([PERSON_KEY, siteId], () => getContactsBySiteId(siteId))

export default useContactBySite
