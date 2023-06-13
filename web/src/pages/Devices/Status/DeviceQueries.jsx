import fetchWrapperForQueries from '../../../components/QueryFetch'
import { getFilters } from '../../../oldComponents/utils'

async function getExportableFile(filtersParams, fileFormat, sortCol, sortDir, page, size, reportName) {
  const filters = getFilters(filtersParams)
  const elem = await fetchWrapperForQueries({
    endpoint: '/device/export',
    params: { sortCol, sortDir, page, size, format: fileFormat, ...filters, hasResults: 1 },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
