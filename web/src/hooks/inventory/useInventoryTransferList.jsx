import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_KEY_TYPE_TRANSFER_ENDPOINT } from './inventoryKeys.js'

const getInventoryTransferList = async params =>
  fetchWrapperForQueries({ endpoint: INVENTORY_KEY_TYPE_TRANSFER_ENDPOINT, params })

const useInventoryTransferList = params =>
  useQuery([INVENTORY_KEY, 'transfer_list', params], () => getInventoryTransferList(params))

export default useInventoryTransferList
