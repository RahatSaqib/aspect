import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { PERSON_KEY, PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID } from './personKeys.js'

const getAssignment = async personId =>
  fetchWrapperForQueries({ endpoint: replaceRouteParams(PERSON_KEY_ASSIGNMENTS_BY_PERSON_ID, { personId }) }).then(
    r => r.data
  )

const usePersonAssignment = id => useQuery([PERSON_KEY, 'person', 'assignment', id], () => getAssignment(id))

export default usePersonAssignment
