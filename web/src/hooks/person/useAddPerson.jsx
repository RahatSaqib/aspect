import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PERSON_KEY_BASE } from './personKeys'

const addPerson = async data => fetchWrapperForQueries({ endpoint: PERSON_KEY_BASE, method: 'POST', params: data })

const useAddPerson = () => {
  const mutation = useMutation(data => addPerson(data))
  return mutation
}

export default useAddPerson
