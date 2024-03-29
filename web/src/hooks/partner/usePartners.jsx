import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { PARTNER_KEY, PARTNER_KEY_LIST_ENDPOINT } from './partnerKeys.js'

const getPartnersList = async () =>
  fetchWrapperForQueries({ endpoint: PARTNER_KEY_LIST_ENDPOINT }).then(response =>
    response.data.map(({ name, id }) => ({
      label: name,
      value: id,
    }))
  )

const usePartners = () => useQuery([PARTNER_KEY], () => getPartnersList(), { ...SELECTS_QUERY_OPTIONS })

export default usePartners
