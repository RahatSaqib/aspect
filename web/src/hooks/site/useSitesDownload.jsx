import { stringify } from 'querystring'
import { defineMessages } from 'react-intl'
import { useQuery, useQueryClient } from 'react-query'
import { getFilters } from '../../components/utils'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../../utils/error/CommonErrorNotifications'
import { aspectFetch } from '../../utils/utils/fetch'
import { downloadFile } from '../../utils/utils/files'
import { SITE_KEY } from './siteKeys.js'

const getDownload = async (filtersParams, sortCol, sortDir, page, pageSize, fileFormat) => {
  const filters = getFilters(filtersParams)
  return aspectFetch(
    `/site/export?${stringify({
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
    }
  ).then(async elem => {
    const file = await elem.blob
    downloadFile(file, 'sites', fileFormat)
  })
}

const useSitesDownload = ({ filtersParams, sortCol, sortDir, page, pageSize, fileFormat, enabled }) => {
  const queryClient = useQueryClient()

  return useQuery(
    [SITE_KEY, 'download'],
    () => getDownload(filtersParams, sortCol, sortDir, page, pageSize, fileFormat),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([SITE_KEY, 'download'])
      },
      enabled,
    }
  )
}

export default useSitesDownload
