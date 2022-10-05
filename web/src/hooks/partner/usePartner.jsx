import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PARTNER_KEY, PARTNER_KEY_ENDPOINT } from './partnerKeys.js'

const getPartner = async () => fetchWrapperForQueries({ endpoint: PARTNER_KEY_ENDPOINT })

const usePartner = () => useQuery([PARTNER_KEY], () => getPartner())

export default usePartner
