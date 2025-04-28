import { stringify } from 'querystring'
import { defineMessages } from 'react-intl'
import { useQuery, useQueryClient } from 'react-query'
import { filterFieldsRejectedError, errorPleaseTryAgainInAFewMinutes } from '../../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../../utils/utils/fetch'
import { downloadFile } from '../../utils/utils/files'
import { DEVICE_API_KEY_KEY } from './deviceApiKeyKeys'

const getDownload = async ({ filters, sortCol, sortDir, page, pageSize, fileFormat }) => {
  return aspectFetch(
    `/deviceApiKey/export?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      format: fileFormat,
      ...filters,
    })}`,
    {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.exportDeviceApiKeys.GET.400.title',
              defaultMessage: 'Exporting DeviceApiKeys Failed',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.exportDeviceApiKeys.GET.default.title',
              defaultMessage: 'Exporting DeviceApiKeys Failed',
            },
          })
        ),
      },
    }
  ).then(async elem => {
    const file = await elem.blob
    downloadFile(file, 'deviceApiKey', fileFormat)
  })
}

const useExportDeviceApiKey = ({ filters, sortCol, sortDir, page, pageSize, fileFormat, enabled }) => {
  const queryClient = useQueryClient()

  return useQuery(
    [DEVICE_API_KEY_KEY, 'download'],
    () => getDownload({ filters, sortCol, sortDir, page, pageSize, fileFormat }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([DEVICE_API_KEY_KEY, 'download'])
      },
      enabled,
    }
  )
}

export default useExportDeviceApiKey
