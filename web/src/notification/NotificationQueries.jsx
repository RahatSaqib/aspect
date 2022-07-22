import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'

import { getFilters } from '../filter/utils'

async function getExportableFile(filtersParams, fileFormat, sortCol, sortDir, page, pageSize, reportName) {
  const filters = getFilters(filtersParams)
  const elem = await fetchWrapperForQueries({
    endpoint: '/notification/export',
    params: {
      sortCol,
      sortDir,
      page,
      size: pageSize,
      format: fileFormat,
      ...filters,
    },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
