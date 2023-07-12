import fetchWrapperForQueries from '../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, size, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/reporter/export',
    params: {
      sortCol,
      sortDir,
      size,
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
