import { defineMessages } from 'react-intl'
import { useMutation, useQueryClient } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { SITE_KEY } from '../site/siteKeys'
import { INVENTORY_KEY, UPDATE_CONSUMABLE_SITES_BATCH_KEY } from './inventoryKeys'

function updateConsumableSitesBatch({ consumableId, siteIds }) {
  return fetchWrapperForQueries({
    endpoint: replaceRouteParams(UPDATE_CONSUMABLE_SITES_BATCH_KEY, { consumableId }),
    method: 'PUT',
    params: { siteIds },
    customErrorNotifications: {
      409: {
        default: {
          severity: 'warn',
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.updateConsumableSitesBatch.title',
              defaultMessage: 'Unable to update some sites',
            },
            message: {
              id: 'errorResponseMessages.updateConsumableSitesBatch.message',
              defaultMessage: 'Some sites could not be updated due to unreconciled consumption. Please reconcile your inventory to complete this action',
            },
          }),
        },
      },
    },
  })
}

export function useUpdateConsumableSitesBatch() {
  const queryClient = useQueryClient()
  const mutation = useMutation(variables => updateConsumableSitesBatch(variables), {
    onSuccess: (data, variables) => {
      queryClient.refetchQueries([SITE_KEY, 'list'])
      queryClient.refetchQueries([SITE_KEY, 'table'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumable'])
      queryClient.refetchQueries([INVENTORY_KEY, 'consumableList'])
    },
  })

  return mutation
}
