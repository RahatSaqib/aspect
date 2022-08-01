import { useQuery } from 'react-query'
import { PERSON_KEY, PERSON_KEY_BY_SITE_ID_ENDPOINT } from './personKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const getContactsBySiteId = async siteId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(PERSON_KEY_BY_SITE_ID_ENDPOINT, { siteId }),
  }).then(response => response.data)

const useContactBySite = siteId => useQuery([PERSON_KEY, 'fruta', siteId], () => getContactsBySiteId(siteId))

export default useContactBySite
