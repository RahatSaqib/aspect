import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/site/export',
    params: { sortCol, sortDir, format: fileFormat, size: 9999999, ...filters }, // see ASP-6066 All pagination and filters defaults should be front-side
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
