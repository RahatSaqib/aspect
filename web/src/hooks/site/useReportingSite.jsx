import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SITE_KEY, SITE_KEY_REPORTING_SITES } from './siteKeys.js'

const getReportingSiteList = async params => fetchWrapperForQueries({ endpoint: SITE_KEY_REPORTING_SITES, params })

const useReportingSiteList = params => useQuery([SITE_KEY, 'reporting', params], () => getReportingSiteList(params))

export default useReportingSiteList
