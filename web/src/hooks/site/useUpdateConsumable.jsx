import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { INVENTORY_KEY } from '../inventory/inventoryKeys'
import { SITE_KEY, SITE_KEY_BATCH_UPDATE_CONSUMABLE, SITE_KEY_UPDATE_CONSUMABLE } from './siteKeys'

function updateConsumable({ siteId, modify, consumable }) {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(SITE_KEY_UPDATE_CONSUMABLE, { siteId }),
    method: 'PUT',
    params: { modify, consumableId: consumable.id },
    customErrorNotifications: {
      409: {
        default: {
          severity: 'warn',
          messageValues: {
            consumableName: consumable.name,
          },
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.updateConsumable.title',
              defaultMessage: 'Unable to delist the cartridge !',
            },
            message: {
              id: 'errorResponseMessages.updateConsumable.message',
              defaultMessage: `As there is unreconciled consumption for the specified cartridge, {consumableName}, system cant allow delisting of the same at the site. Please reconcile your inventory to complete this action`,
            },
          }),
        },
      },
    },
  })
}

function updateConsumablesBatch({ siteId, consumableIds }) {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(SITE_KEY_BATCH_UPDATE_CONSUMABLE, { siteId }),
    method: 'PUT',
    params: { consumableIds },
    customErrorNotifications: {
      409: {
        default: {
          severity: 'warn',
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.updateConsumablesBatch.title',
              defaultMessage: 'Unable to update some consumables',
            },
            message: {
              id: 'errorResponseMessages.updateConsumablesBatch.message',
              defaultMessage: 'Some consumables could not be updated due to unreconciled consumption. Please reconcile your inventory to complete this action',
            },
          }),
        },
      },
    },
  })
}



export default function useUpdateConsumable() {
  const queryClient = useQueryClient()
  const mutation = useMutation(variables => updateConsumable(variables), {
    onSuccess: (data, variables) => {
      queryClient.refetchQueries([SITE_KEY, String(variables.siteId)])
      queryClient.refetchQueries([SITE_KEY, 'list'])
      queryClient.refetchQueries([SITE_KEY, 'table'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumable'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumableList'])
    },
  })

  return mutation
}

export function useUpdateConsumablesBatch() {
  const queryClient = useQueryClient()
  const mutation = useMutation(variables => updateConsumablesBatch(variables), {
    onSuccess: (data, variables) => {
      queryClient.refetchQueries([SITE_KEY, String(variables.siteId)])
      queryClient.refetchQueries([SITE_KEY, 'list'])
      queryClient.refetchQueries([SITE_KEY, 'table'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumable'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumableList'])
    },
  })

  return mutation
}


