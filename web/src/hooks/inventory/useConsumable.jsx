import { useQuery, useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { SELECTS_QUERY_OPTIONS } from '../../utils/consts/ReactQuery/CONSTS'
import {
  INVENTORY_KEY_BY_ID_ENDPOINT,
  INVENTORY_KEY,
  INVENTORY_TYPE_KEY_LIST_ENDPOINT,
  CONSUMABLE_ASSAY_ENDPOINT,
  INVENTORY_KEY_TYPE_UNIT_ENDPOINT,
  UPDATE_CONSUMABLE_KEY,
} from './inventoryKeys'

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
  useQuery([INVENTORY_KEY, 'consumableList', params], () => getConsumableList(params), { ...SELECTS_QUERY_OPTIONS })

const getConsumbableById = async consumableId => {
  return fetchWrapperForQueries({ endpoint: replaceRouteParams(INVENTORY_KEY_BY_ID_ENDPOINT, { consumableId }) }).then(
    response => response
  )
}

const useConsumableById = consumableId =>
  useQuery([INVENTORY_KEY, 'consumable', consumableId], () => getConsumbableById(consumableId))

const getConsumbableAssay = async consumableId => {
  return fetchWrapperForQueries({ endpoint: replaceRouteParams(CONSUMABLE_ASSAY_ENDPOINT, { consumableId }) }).then(
    response => response
  )
}

const useConsumableAssay = consumableId =>
  useQuery([INVENTORY_KEY, consumableId], () => getConsumbableAssay(consumableId))

const getUnits = async () =>
  fetchWrapperForQueries({
    endpoint: INVENTORY_KEY_TYPE_UNIT_ENDPOINT,
  }).then(response => response)

export const useUnit = () => useQuery([INVENTORY_KEY, 'unit'], () => getUnits())

const updateConsumable = ({ consumableId, payload }) => {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(UPDATE_CONSUMABLE_KEY, { consumableId }),
    method: 'PUT',
    params: {
      name: payload.name,
      manufacturer: payload.manufacturer,
      partNumber: payload.partNumber,
      price: payload.price,
      unit: payload.unit,
      trackByExpiration: Boolean(payload.trackByExpiration),
      includeLocation: Boolean(payload.includeLocation),
    },
  })
}

const useUpdateConsumableById = () => useMutation(variables => updateConsumable(variables), {})

export { useConsumable, useConsumableById, useConsumableAssay, useUpdateConsumableById }
