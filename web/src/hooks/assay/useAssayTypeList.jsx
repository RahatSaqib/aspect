import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { ASSAY_KEY, ASSAY_TYPE_KEY_LIST_ENDPOINT } from './assayKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: ASSAY_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useAssayTypeList = () =>
  useQuery([ASSAY_KEY, 'type', 'list'], () => getDeviceSelectList(), { ...SELECTS_QUERY_OPTIONS })

export default useAssayTypeList
