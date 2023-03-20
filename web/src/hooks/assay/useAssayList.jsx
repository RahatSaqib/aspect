import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { ASSAY_KEY, ASSAY_KEY_LIST_ENDPOINT } from './assayKeys.js'

const getDeviceSelectList = async () =>
  fetchWrapperForQueries({ endpoint: ASSAY_KEY_LIST_ENDPOINT }).then(response => response.data)

const useAssayList = () => useQuery([ASSAY_KEY, 'list'], () => getDeviceSelectList())

export default useAssayList
