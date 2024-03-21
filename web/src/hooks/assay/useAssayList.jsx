import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { ASSAY_KEY, ASSAY_KEY_LIST_ENDPOINT } from './assayKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: ASSAY_KEY_LIST_ENDPOINT }).then(response => response.data)

const useAssayList = options =>
  useQuery([ASSAY_KEY, 'list'], () => getDeviceSelectList(), { ...SELECTS_QUERY_OPTIONS, ...options })

export default useAssayList
