import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import { INVENTORY_KEY, INVENTORY_TYPE_KEY_LIST_ENDPOINT } from './inventoryKeys.js'

const getConsumableList = async ({ sortCol, sortDir, pageAt, pageSize, filters }) =>
  fetchWrapperForQueries({
    endpoint: INVENTORY_TYPE_KEY_LIST_ENDPOINT,
    params: {
      sortCol,
      sortDir,
      page: pageAt,
      size: pageSize,
      ...filters,
    },
  }).then(response => response)

const useConsumable = params =>
  useQuery([INVENTORY_KEY, 'consumable', params], () => getConsumableList(params), { ...SELECTS_QUERY_OPTIONS })

export default useConsumable
