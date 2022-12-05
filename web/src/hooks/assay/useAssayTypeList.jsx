import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { ASSAY_KEY, ASSAY_TYPE_KEY_LIST_ENDPOINT } from './assayKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: ASSAY_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useAssayTypeList = () => useQuery([ASSAY_KEY, 'type', 'list'], () => getDeviceSelectList())

export default useAssayTypeList
