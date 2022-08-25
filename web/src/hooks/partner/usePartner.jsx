import { useQuery } from 'react-query'
import { PARTNER_KEY, PARTNER_KEY_ENDPOINT } from './partnerKeys.js'
import fetchWrapperForQueries from '../../components/QueryFetch'

const getPartner = async () => fetchWrapperForQueries({ endpoint: PARTNER_KEY_ENDPOINT })

const usePartner = () => useQuery([PARTNER_KEY], () => getPartner())

export default usePartner
