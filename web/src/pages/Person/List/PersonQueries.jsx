import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/person/export',
    params: { sortCol, sortDir, format: fileFormat, ...filters },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
