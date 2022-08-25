import fetchWrapperForQueries from '../../components/QueryFetch'
import { getFilters } from '../../oldComponents/filter/utils'

async function getExportableFile(filtersParams, fileFormat, sortCol, sortDir, page, pageSize, reportName) {
  const filters = getFilters(filtersParams)
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
  ENDPOINT: '/site/reporters',
  KEY: 'REPORTERS_LIST',
}

const REPORTERS_LIST_REVOKE_ONE = {
  KEY: 'REPORTERS_LIST_REVOKE_ONE',
  ENDPOINT: `/person/refresh-token`,
}

export { REPORTERS_LIST, REPORTERS_LIST_REVOKE_ONE, getExportableFile }
