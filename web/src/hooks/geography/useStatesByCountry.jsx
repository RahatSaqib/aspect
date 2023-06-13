import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { STATE_KEY, STATE_KEY_BY_COUNTRY_ID_ENDPOINT } from './geographyKeys.js'

const getStatesByCountryId = async countryId =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(STATE_KEY_BY_COUNTRY_ID_ENDPOINT, { countryId }),
  }).then(response => response.data)

const useStatesByCountry = (countryId, options) =>
  useQuery([STATE_KEY, countryId], () => getStatesByCountryId(countryId), options)

export default useStatesByCountry
