import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { AUTO_INVENTORY_RECOCILIATION_KEY } from './inventoryKeys.js'

const autoReconcile = async data => {
  return fetchWrapperForQueries({
    endpoint: AUTO_INVENTORY_RECOCILIATION_KEY,
    method: 'POST',
    params: JSON.stringify(data),
  })
}

const useAutoReconcile = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation(data => autoReconcile(data), {
    onSuccess: () => {
      queryClient.invalidateQueries([])
    },
  })

  return mutation
}

export default useAutoReconcile
