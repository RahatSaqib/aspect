import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PERSON_KEY, PERSON_KEY_LIST } from './personKeys.js'

const getPersonList = async () => fetchWrapperForQueries({ endpoint: PERSON_KEY_LIST }).then(response => response.data)

const usePersonList = () => useQuery([PERSON_KEY, 'list'], () => getPersonList())

export default usePersonList
