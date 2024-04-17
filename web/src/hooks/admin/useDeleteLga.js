import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../components/QueryFetch'
import { replaceRouteParams } from '../../components/QueryFetch/Helpers'
import { DELETE_ADMIN_LGA_ENDPOINT } from './adminKeys'
import { errorConflict } from '../../utils/error/CommonErrorNotifications'
import { defineMessages } from 'react-intl'

export function useDeleteLga(options) {
  return useMutation(
    ({ lgaId }) =>
      fetchWrapperForQueries({
        endpoint: replaceRouteParams(DELETE_ADMIN_LGA_ENDPOINT, { lgaId }),
        method: 'DELETE',
        customErrorNotifications: {
          409: errorConflict(
            defineMessages({
              title: {
                id: 'queryFetch.errorResponseMessages.GET.409.title',
                defaultMessage: ' data',
              },
            })
          ),
        },
      }),
    { ...options }
  )
}
