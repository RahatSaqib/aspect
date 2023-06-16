import fetchWrapperForQueries from '../../../components/QueryFetch'

async function getExportableFile(
  filters,
  fileFormat,
  sortCol,
  sortDir,
  size,
  reportName,
  endpoint = '/inventory/export'
) {
  const elem = await fetchWrapperForQueries({
    endpoint,
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

export default getExportableFile
