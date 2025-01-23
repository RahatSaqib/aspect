import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { AUTO_INVENTORY_RECONCILIATION_KEY, INVENTORY_RECONCILIATION_KEY } from './inventoryKeys.js'

const autoReconcile = async data => {
  return fetchWrapperForQueries({
    endpoint: AUTO_INVENTORY_RECONCILIATION_KEY,
    method: 'POST',
    params: JSON.stringify(data),
  })
}

const useAutoReconcile = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => autoReconcile(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([INVENTORY_RECONCILIATION_KEY, 'unreconcileInventory'])
    },
  })

  return mutation
}

export default useAutoReconcile
