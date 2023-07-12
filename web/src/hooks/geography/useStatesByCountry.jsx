import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { STATE_KEY, STATE_KEY_BY_COUNTRY_ID_ENDPOINT } from './geographyKeys.js'

const getStatesByCountryId = async (countryId, returnAll) =>
  fetchWrapperForQueries({
    endpoint: replaceRouteParams(STATE_KEY_BY_COUNTRY_ID_ENDPOINT, { countryId }),
    params: { all: returnAll },
  }).then(response => response.data)

const useStatesByCountry = ({ countryId, returnAll }, options) =>
  useQuery([STATE_KEY, countryId, returnAll], () => getStatesByCountryId(countryId, returnAll), options)

export default useStatesByCountry
