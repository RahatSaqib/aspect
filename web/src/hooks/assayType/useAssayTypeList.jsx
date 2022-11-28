import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { ASSAY_TYPE_KEY, ASSAY_TYPE_KEY_LIST_ENDPOINT } from './assayTypeKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: ASSAY_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useAssayTypeList = () => useQuery([ASSAY_TYPE_KEY, 'list'], () => getDeviceSelectList())

export default useAssayTypeList
