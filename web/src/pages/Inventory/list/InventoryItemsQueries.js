import { defineMessages } from 'react-intl'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { errorPleaseTryAgainInAFewMinutes } from '../../../utils/error/CommonErrorNotifications'

const onHandErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.addInventory.PUT.default.title',
    defaultMessage: 'Adding Inventory Failed',
  },
})

export function modifyInventoryOnHand(values, { siteId, consumableId, lotNumber }) {
  return fetchWrapperForQueries({
    endpoint: '/inventory/on-hand',
    method: 'PUT',
    params: {
      siteId,
      consumableId,
      lotNumber,
      ...values,
    },
    customErrorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes(onHandErrorMessages),
    },
  })
}

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
