import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PERSON_KEY, PERSON_KEY_BASE } from './personKeys.js'

const getPersons = async params =>
  fetchWrapperForQueries({ endpoint: PERSON_KEY_BASE, params }).then(response => ({
    data: response.data,
    total: response.total,
  }))

const usePersons = params => useQuery([PERSON_KEY, 'all', params], () => getPersons(params))

export default usePersons
