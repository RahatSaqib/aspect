import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import { INVENTORY_OVERVIEW_KEY, INVENTORY_OVERVIEW_ENDPOINT } from './inventoryOverviewKeys.js'

const getInventoryOverviewData = async params =>
  fetchWrapperForQueries({
    endpoint: INVENTORY_OVERVIEW_ENDPOINT,
    params,
  }).then(response => [response.data.country])

const useInventoryOverview = (params, { enabled }) => {
  return useQuery([INVENTORY_OVERVIEW_KEY, params], () => getInventoryOverviewData(params), { enabled })
}

export default useInventoryOverview
