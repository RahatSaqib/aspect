import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { COUNTRY_KEY, COUNTRY_KEY_ENDPOINT } from './geographyKeys.js'

const getCountryById = async () =>
  fetchWrapperForQueries({ endpoint: COUNTRY_KEY_ENDPOINT }).then(response => response.data)

const useCountries = () => useQuery([COUNTRY_KEY], () => getCountryById())

export default useCountries
