import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_RECONCILIATION_KEY, INVENTORY_RECONCILIATION_ENDPOINT } from './inventoryKeys.js'

const getInventoryReconciliation = async params =>
  fetchWrapperForQueries({ endpoint: INVENTORY_RECONCILIATION_ENDPOINT, params })

export default function useInventoryReconciliation(params) {
  return useQuery([INVENTORY_RECONCILIATION_KEY, 'unreconcileInventory', params], () =>
    getInventoryReconciliation(params)
  )
}
