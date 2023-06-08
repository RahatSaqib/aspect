import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_TYPE_KEY_LIST_ENDPOINT } from './inventoryKeys.js'

const getConsumableList = async () =>
  fetchWrapperForQueries({ endpoint: INVENTORY_TYPE_KEY_LIST_ENDPOINT }).then(response => response.data)

const useConsumable = () => useQuery([INVENTORY_KEY, 'consumable'], () => getConsumableList())

export default useConsumable
