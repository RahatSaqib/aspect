// Import packages
import _ from 'lodash'
import {
  defineMessages
} from 'react-intl'

const messages = defineMessages({
  noFilters: {
    id: 'shared.ListFilter.noFilters',
    defaultMessage: 'No filters set - showing all'
  },
  geographyIn: {
    id: 'shared.ListFilter.geographyIn',
    defaultMessage: 'in'
  },
  whoseNameIncludes: {
    id: 'shared.ListFilter.whoseNameIncludes',
    defaultMessage: 'whose name includes'
  },
  assays: {
    id: 'shared.ListFilter.assays',
    defaultMessage: 'assays'
  },
  withResult: {
    id: 'shared.ListFilter.withResult',
    defaultMessage: 'with result'
  },
  dateFrom: {
    id: 'shared.ListFilter.dateFrom',
    defaultMessage: 'from'
  },
  dateTo: {
    id: 'shared.ListFilter.dateTo',
    defaultMessage: 'to'
  }
})

// takes template message and filter settings and translates it into
// a human readable string
export default function getFilterMessage(
  filter,
  countries,
  assays,
  subject,
  template,
  optionalTemplate,
  formatMessage,
  formatDate) {
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

  // The optional template lets us specify a message that only shows up if
  // assay, result, or date is set. For example, if we want to show a message that explains
  // the number of results on a device
  let optionalMessage = ''
  if (optionalTemplate && (assayString || resultString || dateString)) {
    optionalMessage = optionalTemplate
                        .replace('<ASSAY>', assayString)
                        .replace('<RESULT>', resultString)
                        .replace('<DATE>', dateString)
  }

  const message = `${template
                        .replace('<GEOGRAPHY>', geography)
                        .replace('<NAME>', nameString)
                        .replace('<ASSAY>', assayString)
                        .replace('<RESULT>', resultString)
                        .replace('<DATE>', dateString)} ${optionalMessage}`

  return message
}
