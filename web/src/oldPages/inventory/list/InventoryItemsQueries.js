import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, reportName, endpoint = '/inventory/export') {
  const elem = await fetchWrapperForQueries({
    endpoint,
    params: {
      sortCol,
      sortDir,
      size: 99999999,
      format: fileFormat,
      ...filters,
    },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
