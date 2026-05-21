import { stringify } from 'querystring'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { defineMessages } from 'react-intl'
import { useQuery, useQueryClient } from 'react-query'
import { getISOFromString } from '../../components/shared/DateTimeInput/utils/date'
import {
  errorForbidden,
  errorPleaseTryAgainInAFewMinutes,
  filterFieldsRejectedError,
} from '../../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../../utils/utils/fetch'
import { downloadFile } from '../../utils/utils/files'
import { WORKLOAD_KEY, WORKLOAD_KEY_EXPORT_ENDPOINT } from './workloadKeys.js'

const getDownload = async (filtersParams, fileFormat) => {
  return aspectFetch(
    `${WORKLOAD_KEY_EXPORT_ENDPOINT}?${stringify({
      format: fileFormat,
      ...filtersParams,
    })}`,
    {
      errorNotifications: {
        400: filterFieldsRejectedError(
          defineMessages({
            title: {
              id: 'errorResponseMessages.exportWorkload.GET.400.title',
              defaultMessage: 'Exporting Device Workload Failed',
            },
          })
        ),
        403: errorForbidden(
          defineMessages({
            title: {
              id: 'errorResponseMessages.exportWorkload.GET.403.title',
              defaultMessage: 'Insufficient Permissions',
            },
          })
        ),
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.exportWorkload.GET.default.title',
              defaultMessage: 'Exporting Device Workload Failed',
            },
          })
        ),
      },
    }
  ).then(async elem => {
    const file = await elem.blob
    downloadFile(file, 'deviceWorkload', fileFormat)
  })
}

const useWorkloadDownload = requestParams => {
  const { fileFormat, enabled, sortDir, sortCol, size, page, minDate, maxDate, ...filtersParams } = requestParams
  const queryClient = useQueryClient()

  return useQuery(
    [WORKLOAD_KEY, 'download'],
    () =>
      getDownload(
        omitBy(
          {
            ...filtersParams,
            minDate: getISOFromString(minDate),
            maxDate: getISOFromString(maxDate),
          },
          isNil
        ),
        fileFormat
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([WORKLOAD_KEY, 'download'])
      },
      enabled,
    }
  )
}

export default useWorkloadDownload
