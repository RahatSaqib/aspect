import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import fetchWrapperForQueries from '../../components/QueryFetch'

async function getExportableFile(filters, fileFormat, sortCol, sortDir, reportName, endpoint = '/result/export') {
  const cleanedFilters = omitBy(omit(filters, ['assayOverride']), isNil)
  const elem = await fetchWrapperForQueries({
    endpoint,
    params: {
      format: fileFormat,
      sortCol,
      sortDir,
      ...cleanedFilters,
    },
  })

  return { elem, fileFormat, reportName }
}

export default getExportableFile
