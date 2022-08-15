import fetchWrapperForQueries from '../../components/QueryFetch'
import { getFilters } from '../../oldComponents/filter/utils'

async function getExportableFile(
  filtersParams,
  fileFormat,
  sortCol,
  sortDir,
  page,
  pageSize,
  reportName,
  endpoint = '/result/export'
) {
  const filters = getFilters(filtersParams)
  const elem = await fetchWrapperForQueries({
    endpoint,
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
