import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_KEY_LIST_ENDPOINT } from './inventoryKeys.js'

const getInventoryList = async params => fetchWrapperForQueries({ endpoint: INVENTORY_KEY_LIST_ENDPOINT, params })

const useInventoryList = params => useQuery([INVENTORY_KEY, 'inventory_list', params], () => getInventoryList(params))

export default useInventoryList
