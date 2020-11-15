import fromPairs from 'lodash/fromPairs'
import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'

async function getExportableFile(
  filtersParams,
  fileFormat,
  sortCol,
  sortDir,
  page,
  pageSize,
  reportName
) {
  const filters = fromPairs([...filtersParams.entries()])
  const elem = await fetchWrapperForQueries({
    endpoint: '/reporter/export',
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

const REPORTERS_LIST = {
  ENDPOINT: '/person/refresh-token',
  KEY: 'REPORTERS_LIST',
}

const REPORTERS_LIST_REVOKE_ONE = {
  KEY: 'REPORTERS_LIST_REVOKE_ONE',
  ENDPOINT: `/person/refresh-token`,
}

export { REPORTERS_LIST, REPORTERS_LIST_REVOKE_ONE, getExportableFile }
