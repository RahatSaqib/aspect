import _ from 'lodash'

export function nonEmptyFilterValue(x) {
  return !_.isNull(x) && !_.isUndefined(x) && x !== ''
}

export const mergeToFiltersParams = (filters, filtersParams) =>
  _.reduce(
    filters,
    (filtersParams, v, k) => {
      if (nonEmptyFilterValue(v)) {
        filtersParams.set(k, v)
      } else {
        filtersParams.delete(k)
      }
      return filtersParams
    },
    filtersParams
  )

const defaultSanitizer = (a, k) => {
  const { value } = a
  if (nonEmptyFilterValue(value.get(k))) {
    value.delete(k)
    return {
      sanitized: true,
      value,
    }
  }
  return a
}

const makeArraySanitizer = keys => a => keys.reduce(defaultSanitizer, a)

const makeKeySanitizer = k => a => defaultSanitizer(a, k)

const sanitizerByConfigKey = {
  assayAndResultCategory: makeArraySanitizer(['assayId', 'resultCategoryId']),
  geography: makeArraySanitizer(['countryId', 'stateId', 'lgaId']),
  state: _.identity,
  lga: _.identity,
  date: makeArraySanitizer(['minDate', 'maxDate']),
  patientOrResearchId: defaultSanitizer,
  partnerId: defaultSanitizer,
  sampleId: defaultSanitizer,
  sampleGroup: defaultSanitizer,
  deviceName: defaultSanitizer,
  siteName: defaultSanitizer,
  sampleOriginSite: defaultSanitizer,
  contactNameOrEmail: defaultSanitizer,
  externalId: defaultSanitizer,
  consumable: makeKeySanitizer('consumableId'),
  workflowStatus: makeKeySanitizer('workflowStatusId'),
  deviceStatus: makeKeySanitizer('deviceStatusId'),
}

export const sanitizeFiltersStringBy = config => filtersString =>
  _.reduce(
    sanitizerByConfigKey,
    (acc, sanitizer, key) => {
      if (config[key]) {
        return acc
      }
      return sanitizer(acc, key)
    },
    {
      sanitized: false,
      value: new URLSearchParams(filtersString),
    }
  )
