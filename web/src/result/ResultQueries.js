import fromPairs from 'lodash/fromPairs'
import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'

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
  const filters = fromPairs([...filtersParams.entries()])
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
