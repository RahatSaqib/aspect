import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { SITE_TO_TRANSFER_ENDPOINT, SITE_TO_TRANSFER_KEY } from './siteKeys'

const getSitesToTransfer = async () =>
  fetchWrapperForQueries({ endpoint: SITE_TO_TRANSFER_ENDPOINT }).then(response => response.data)

const useSitesToTransfer = () =>
  useQuery([SITE_TO_TRANSFER_KEY], () => getSitesToTransfer(), { ...SELECTS_QUERY_OPTIONS })

export default useSitesToTransfer
