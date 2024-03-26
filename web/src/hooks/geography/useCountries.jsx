import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { COUNTRY_KEY, COUNTRY_KEY_ENDPOINT } from './geographyKeys.js'

const getCountryById = async returnAll =>
  fetchWrapperForQueries({ endpoint: COUNTRY_KEY_ENDPOINT, params: { all: returnAll } }).then(response => response.data)

const useCountries = (returnAll = false) =>
  useQuery([COUNTRY_KEY, returnAll], () => getCountryById(returnAll), { ...SELECTS_QUERY_OPTIONS })

export default useCountries
