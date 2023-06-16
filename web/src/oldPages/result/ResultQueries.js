import fetchWrapperForQueries from '../../components/QueryFetch'

async function getExportableFile(
  filters,
  fileFormat,
  sortCol,
  sortDir,
  page,
  pageSize,
  reportName,
  endpoint = '/result/export'
) {
  const elem = await fetchWrapperForQueries({
    endpoint,
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

export default getExportableFile
