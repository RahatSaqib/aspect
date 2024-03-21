import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PARTNER_KEY, PARTNER_KEY_LIST_ENDPOINT } from './partnerKeys.js'

const getPartnersList = async () =>
  fetchWrapperForQueries({ endpoint: PARTNER_KEY_LIST_ENDPOINT }).then(response =>
    response.data.map(({ name, id }) => ({
      label: name,
      value: id,
    }))
  )

const usePartners = () => useQuery([PARTNER_KEY], () => getPartnersList())

export default usePartners
