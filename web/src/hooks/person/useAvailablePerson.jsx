import { useQuery } from 'react-query'
import { PERSON_KEY, PERSON_KEY_AVAILABLE_ENDPOINT } from './personKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const getAvailablePerson = async () =>
  fetchWrapperForQueries({ endpoint: PERSON_KEY_AVAILABLE_ENDPOINT }).then(response => response.data)

const useAvailablePerson = () => useQuery([PERSON_KEY, 'available'], () => getAvailablePerson())

export default useAvailablePerson
