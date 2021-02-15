import fromPairs from 'lodash/fromPairs'
import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'

async function getExportableFile(
  filtersParams,
  fileFormat,
  sortCol,
  sortDir,
  reportName
) {
  const filters = fromPairs([...filtersParams.entries()])
  const elem = await fetchWrapperForQueries({
    endpoint: '/result/export',
    params: {
      sortCol,
      sortDir,
      format: fileFormat,
      ...filters,
    },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
