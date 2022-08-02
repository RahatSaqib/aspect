import { useQuery } from 'react-query'
import { COUNTRY_KEY, COUNTRY_KEY_ENDPOINT } from './geographyKeys.js'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'

const getSiteById = async () =>
  fetchWrapperForQueries({ endpoint: COUNTRY_KEY_ENDPOINT }).then(response => response.data)

const useSite = () => useQuery([COUNTRY_KEY], () => getSiteById())

export default useSite
