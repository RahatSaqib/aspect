import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, page, size, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/person/export',
    params: { sortCol, sortDir, page, size, format: fileFormat, ...filters },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
