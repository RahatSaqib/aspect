import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { IMPLEMENTING_PARTNERS_ENDPOINT, IMPLEMENTING_PARTNERS_KEY } from './partnerKeys.js'

const getImplementingPartnersList = async () =>
  fetchWrapperForQueries({ endpoint: IMPLEMENTING_PARTNERS_ENDPOINT }).then(response =>
    response.data.map(({ name, id }) => ({
      label: name,
      value: id,
    }))
  )

const useImplementingPartners = () =>
  useQuery([IMPLEMENTING_PARTNERS_KEY], () => getImplementingPartnersList(), { ...SELECTS_QUERY_OPTIONS })

export default useImplementingPartners
