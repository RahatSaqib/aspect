import { defineMessages } from 'react-intl'
import { useQuery, useQueryClient } from 'react-query'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../../utils/utils/fetch'
import { downloadFile } from '../../utils/utils/files'
import stringifyQuery from '../../utils/utils/queryString'
import { INVENTORY_KEY } from './inventoryKeys.js'

const getDownload = async restParams => {
  const { fileFormat, ...rest } = restParams
  if (rest.minDate) {
    rest.minDate = rest.minDate.toISOString()
  }
  if (rest.maxDate) {
    rest.maxDate = rest.maxDate.toISOString()
  }

  return aspectFetch(`/inventory/transfer/export?${stringifyQuery({ ...rest, format: fileFormat })}`, {
    errorNotifications: {
      400: filterFieldsRejectedError(
        defineMessages({
          title: {
            id: 'errorResponseMessages.exportSites.GET.400.title',
            defaultMessage: 'Exporting Sites Failed',
          },
        })
      ),
      403: errorForbidden(
        defineMessages({
          title: {
            id: 'errorResponseMessages.exportSites.GET.403.title',
            defaultMessage: 'Insufficient Permissions',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.exportSites.GET.default.title',
            defaultMessage: 'Exporting Sites Failed',
          },
        })
      ),
    },
  }).then(async elem => {
    const file = await elem.blob
    downloadFile(file, 'transfers', fileFormat)
  })
}

const useInventoryTransferDownload = params => {
  const { enabled, ...restParams } = params
  const queryClient = useQueryClient()
  return useQuery([INVENTORY_KEY, 'download', params], () => getDownload(restParams), {
    onSuccess: () => queryClient.invalidateQueries([INVENTORY_KEY, 'download', params]),
    enabled,
  })
}

export default useInventoryTransferDownload
