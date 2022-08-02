import { useQuery } from 'react-query'
import { COUNTRY_KEY, STATE_KEY_BY_COUNTRY_ID_ENDPOINT } from './geographyKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { replaceRouteParams } from '../../MigratedComponents/QueryFetch/Helpers'

const getStatesByCountryId = async countryId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(STATE_KEY_BY_COUNTRY_ID_ENDPOINT, { countryId }),
  }).then(response => response.data)

const useStatesByCountry = (countryId, options) =>
  useQuery([COUNTRY_KEY, countryId], () => getStatesByCountryId(countryId), options)

export default useStatesByCountry
