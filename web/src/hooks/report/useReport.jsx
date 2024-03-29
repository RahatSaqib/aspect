import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { REPORT_KEY, REPORT_KEY_REPORT_SELECT_LIST_ENDPOINT } from './reportKeys.js'

const getReports = async () =>
  fetchWrapperForQueries({ endpoint: REPORT_KEY_REPORT_SELECT_LIST_ENDPOINT }).then(response => response.data)

const useReport = () => useQuery([REPORT_KEY, 'list'], () => getReports(), { ...SELECTS_QUERY_OPTIONS })

export default useReport
