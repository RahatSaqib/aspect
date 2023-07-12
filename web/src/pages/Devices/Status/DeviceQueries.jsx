import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, size, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/device/export',
    params: { sortCol, sortDir, size, format: fileFormat, ...filters, hasResults: 1 },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
