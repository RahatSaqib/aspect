import { useQuery } from 'react-query'
import fetchWrapperForQueries from '../../../../../components/QueryFetch'
import { INVENTORY_OVERVIEW_KEY, INVENTORY_OVERVIEW_ENDPOINT } from './inventoryOverviewKeys.js'

const getInventoryOverviewData = async ({ consumableExternalId, minDate, maxDate }) =>
  fetchWrapperForQueries({
    endpoint: INVENTORY_OVERVIEW_ENDPOINT,
    params: { consumableExternalId, minDate, maxDate },
  }).then(response => [response.data.country])

const useInventoryOverview = ({ consumableExternalId, minDate, maxDate }, { enabled }) => {
  const params = { consumableExternalId, minDate, maxDate }
  return useQuery([INVENTORY_OVERVIEW_KEY, params], () => getInventoryOverviewData(params), { enabled })
}

export default useInventoryOverview
