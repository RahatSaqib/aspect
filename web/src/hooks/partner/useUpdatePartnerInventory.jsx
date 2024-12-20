import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { PARTNER_UPDATE_INVENTORY_ENDPOINT } from './partnerKeys'

const updatePartnerInventory = async config => {
  return fetchWrapperForQueries({
    endpoint: PARTNER_UPDATE_INVENTORY_ENDPOINT,
    method: 'POST',
    params: config,
  })
}

export function useUpdatePartnerInventory(options) {
  return useMutation(arg => updatePartnerInventory(arg), options)
}
