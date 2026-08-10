import { defineMessages } from 'react-intl'
import { getFilters } from '../../components/utils'
import { errorPleaseTryAgainInAFewMinutes, filterFieldsRejectedError } from '../../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../../utils/utils/fetch'
import { downloadFile } from '../../utils/utils/files'
import stringifyQuery from '../../utils/utils/queryString'

const filterErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.store.exportResults.GET.400.title',
    defaultMessage: 'Exporting DeviceLog Failed',
  },
})

const defaultErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.device.exportResults.GET.default.title',
    defaultMessage: 'Exporting Device Log Failed',
  },
})

export async function exportDeviceLogs(filtersParams, fileFormat, reportName) {
  const filters = getFilters(filtersParams)
  const elem = await aspectFetch(
    `/device/exportDeviceLogs?${stringifyQuery({
      format: fileFormat,
      ...filters,
    })}`,
    {
      errorNotifications: {
        400: filterFieldsRejectedError(filterErrorMessages),
        default: errorPleaseTryAgainInAFewMinutes(defaultErrorMessages),
      },
    }
  )

  downloadFile(await elem.blob, reportName, fileFormat)
}
