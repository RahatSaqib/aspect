import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_RECONCILIATION_KEY } from '../inventory/inventoryKeys'
import { PARTNER_UPDATE_INVENTORY_ENDPOINT } from './partnerKeys'

const updatePartnerInventory = async config => {
  return fetchWrapperForQueries({
    endpoint: PARTNER_UPDATE_INVENTORY_ENDPOINT,
    method: 'POST',
    params: config,
  })
}

export function useUpdatePartnerInventory() {
  const queryClient = useQueryClient()

  return useMutation(arg => updatePartnerInventory(arg), {
    onSuccess: () => {
      queryClient.removeQueries([INVENTORY_KEY])
      queryClient.removeQueries([INVENTORY_RECONCILIATION_KEY])
    },
  })
}
