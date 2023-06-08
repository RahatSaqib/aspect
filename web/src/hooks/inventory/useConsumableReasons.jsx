import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_REASON_KEY_LIST_ENDPOINT } from './inventoryKeys.js'

const getConsumableReasonList = async () =>
  fetchWrapperForQueries({ endpoint: INVENTORY_REASON_KEY_LIST_ENDPOINT }).then(response => response.data)

const useConsumableReasons = () => useQuery([INVENTORY_KEY, 'consumable', 'reason'], () => getConsumableReasonList())

export default useConsumableReasons
