import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { COUNTRY_KEY, COUNTRY_KEY_ENDPOINT } from './geographyKeys.js'

const getCountryById = async returnAll =>
  fetchWrapperForQueries({ endpoint: COUNTRY_KEY_ENDPOINT, params: { all: returnAll } }).then(response => response.data)

const useCountries = returnAll => useQuery([COUNTRY_KEY, returnAll], () => getCountryById(returnAll))

export default useCountries
