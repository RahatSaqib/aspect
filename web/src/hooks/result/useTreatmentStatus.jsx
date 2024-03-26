import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { RESULT_KEY, RESULT_KEY_RESULT_TREATMENT_STATUS_ENDPOINT } from './resultKeys.js'

const getTreatmentStatus = async () =>
  fetchWrapperForQueries({ endpoint: RESULT_KEY_RESULT_TREATMENT_STATUS_ENDPOINT }).then(response => response.data)

const useTreatmentStatus = () =>
  useQuery([RESULT_KEY, 'treatment'], () => getTreatmentStatus(), { ...SELECTS_QUERY_OPTIONS })

export default useTreatmentStatus
