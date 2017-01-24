// Import packages
import _ from 'lodash'
import {
  defineMessages
} from 'react-intl'

export function nonEmptyFilterValue(x) {
  return !_.isNull(x) && !_.isUndefined(x)
}

const messages = defineMessages({
  noFilters: {
    id: 'shared.FormatFilters.noFilters',
    defaultMessage: 'No filters set - showing all'
  },
  geographyIn: {
    id: 'shared.FormatFilters.geographyIn',
    defaultMessage: 'in'
  },
  whoseNameIncludes: {
    id: 'shared.FormatFilters.whoseNameIncludes',
    defaultMessage: 'whose name includes'
  },
  assays: {
    id: 'shared.FormatFilters.assays',
    defaultMessage: 'assays'
  },
  consumables: {
    id: 'shared.FormatFilters.consumables',
    defaultMessage: 'consumables'
  },
  sampleOriginSiteId: {
    id: 'shared.FormatFilters.sampleOriginSiteId',
    defaultMessage: 'sample origin site'
  },
  sampleId: {
    id: 'shared.FormatFilters.sampleId',
    defaultMessage: 'sample'
  },
  withResult: {
    id: 'shared.FormatFilters.withResult',
    defaultMessage: 'with result'
  },
  dateFrom: {
    id: 'shared.FormatFilters.dateFrom',
    defaultMessage: 'from'
  },
  dateTo: {
    id: 'shared.FormatFilters.dateTo',
    defaultMessage: 'to'
  },
  workflowStatuses: {
    id: 'shared.FormatFilters.workflowStatuses',
    defaultMessage: ''
  },
  withDeviceStatus: {
    id: 'shared.FormatFilters.withDeviceStatus',
    defaultMessage: 'with device status'
  }
})

// takes template message and filter settings and translates it into
// a human readable string
export function getFilterMessage(
  filter,
  countries,
  assays,
  consumables,
  siteItemsById,
  subject,
  template = 'Viewing items<GEOGRAPHY><NAME>',
  optionalTemplate,
  formatMessage,
  formatDate,
  workflowStatuses,
  deviceStatuses) {
  // return empty message if no filters set
  if (_.every(filter, f => !f)) {
    return `${formatMessage(messages.noFilters)} ${subject ? subject.toLowerCase() : ''}`
  }

  // using a constant for space for better readability
  const SPACE = ' '

  // location-related strings
  let geography = ''
  const country = filter.countryId ? countries.get('items').find(c => c.id === filter.countryId) : null
  const state = country && filter.stateId ? country.getIn(['children', 'items']).find(s => s.id === filter.stateId) : null
  const lga = state && filter.lgaId ? state.getIn(['children', 'items']).find(s => s.id === filter.lgaId) : null

  if (country || state || lga) {
    geography = ` ${formatMessage(messages.geographyIn)}${SPACE}
                  ${lga ? `${lga.get('name')},${SPACE}` : ''}
                  ${state ? `${state.get('name')},${SPACE}` : ''}
                  ${country.get('name')}`
  }

  // name-filter
  const name = `${filter.contactNameOrEmail || ''}${filter.deviceName || ''}${filter.siteName || ''}`
  const nameString = name ? `${SPACE}${formatMessage(messages.whoseNameIncludes)}${SPACE}"${name}"` : ''

  // sample origin site id
  const sampleOriginSite = filter.sampleOriginSiteId ? siteItemsById.valueSeq().find(s => s.get('id') === filter.sampleOriginSiteId) : null
  const sampleOriignSiteIdString = sampleOriginSite ? `${formatMessage(messages.sampleOriginSiteId)}${SPACE}(${sampleOriginSite.get('name')}),${SPACE}` : ''

  // sample id
  const sampleId = filter.sampleId
  const sampleIdString = sampleId ? `${formatMessage(messages.sampleId)}${SPACE}(${sampleId}),${SPACE}` : ''

  // assay/result
  const assay = filter.assayId ? assays.get('items').find(a => a.get('id') === filter.assayId) : null
  const result = assay && filter.resultCategoryId ?
    assay.get('resultCategories').find(r => r.get('id') === String(filter.resultCategoryId)) : null
  const assayString = assay ? assay.get('name') : ''
  const resultString = result ? `${SPACE}${formatMessage(messages.withResult)}${SPACE}"${result.get('name')}"` : ''

  // date
  const dateFrom = filter.minDate ? `${formatMessage(messages.dateFrom)}${SPACE}${formatDate(filter.minDate)}` : ''
  const dateTo = filter.maxDate ? `${formatMessage(messages.dateTo)}${SPACE}${formatDate(filter.maxDate)}` : ''

  // TODO: This could be a little nicer and use the date type from the filter.
  // Could say "the year 2015" or "the month of August"
  const dateString = `${dateFrom ? `${SPACE}${dateFrom}` : ''}${dateTo && dateFrom ? `${SPACE}${dateTo}` : dateTo}`

  // inventory item
  const consumable = filter.consumableId ? consumables.get('items').find(a => a.get('id') === filter.consumableId) : null
  const consumableString = consumable ? consumable.get('name') : formatMessage(messages.consumables)

  // result workflow status
  const workflowStatus = filter.workflowStatusId ? workflowStatuses.find(a => a.get('id') === filter.workflowStatusId) : null
  const noWorkflowStatus = ''
  const workflowStatusString = workflowStatus ? `with workflow status ${workflowStatus.get('name')}` : noWorkflowStatus

  // device status
  const deviceStatus = filter.deviceStatusId ? deviceStatuses.find(s => s.get('id') === filter.deviceStatusId) : null
  const noDeviceStatus = ''
  const deviceStatusString = deviceStatus ? `${SPACE}${formatMessage(messages.withDeviceStatus)}${SPACE}"${deviceStatus.get('name')}"` : noDeviceStatus

  // The optional template lets us specify a message that only shows up if
  // assay, result, or date is set. For example, if we want to show a message that explains
  // the number of results on a device
  let optionalMessage = ''
  if (optionalTemplate && (assayString || resultString || dateString)) {
    optionalMessage = optionalTemplate
                        .replace('<ASSAY>', assayString)
                        .replace('<RESULT>', resultString)
                        .replace('<DATE>', dateString)
                        .replace('<CONSUMABLE>', consumableString)
  }

  const message = `${template
                        .replace('<GEOGRAPHY>', geography)
                        .replace('<NAME>', nameString)
                        .replace('<SAMPLE_ORIGIN_SITE_ID>', sampleOriignSiteIdString)
                        .replace('<SAMPLE_ID>', sampleIdString)
                        .replace('<ASSAY>', assayString)
                        .replace('<RESULT>', resultString)
                        .replace('<DATE>', dateString)} ${optionalMessage}`
                        .replace('<CONSUMABLE>', consumableString)
                        .replace('<WORKFLOWSTATUS>', workflowStatusString)
                        .replace('<DEVICESTATUS>', deviceStatusString)

  return message
}
