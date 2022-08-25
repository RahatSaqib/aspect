import fetchWrapperForQueries from '../../components/QueryFetch'
import { getFilters } from '../../oldComponents/filter/utils'

async function getExportableFile(filtersParams, fileFormat, sortCol, sortDir, page, pageSize, reportName) {
  const filters = getFilters(filtersParams)
  const elem = await fetchWrapperForQueries({
    endpoint: '/device/export',
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
