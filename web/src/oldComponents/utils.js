import filter from 'lodash/filter'
import find from 'lodash/find'
import isArray from 'lodash/isArray'
import isNil from 'lodash/isNil'
import isNull from 'lodash/isNull'
import isUndefined from 'lodash/isUndefined'
import reduce from 'lodash/reduce'

function nonEmptyFilterValue(x) {
  return !isNull(x) && !isUndefined(x) && x !== ''
}

export const mergeToFiltersParams = (filters, filtersParams) => {
  return reduce(
    filters,
    (filtersParams, v, k) => {
      if (nonEmptyFilterValue(v)) {
        if (isArray(v)) {
          filtersParams.delete(k)
          v.forEach(value => filtersParams.append(k, value))
        } else {
          filtersParams.set(k, v)
        }
      } else {
        filtersParams.delete(k)
      }
      return filtersParams
    },
    filtersParams
  )
}

const groups = {
  assayAndResultCategory: ['assayId', 'resultCategoryId', 'resultCategory2Id', 'resultCategoryGroupId', 'diseaseId'],
  geography: ['countryId', 'stateId', 'lgaId'],
  date: ['minDate', 'maxDate'],
}

const findFilterConfigByKey = (config, key) => find(config, configObject => configObject[key])

const getFilterGroupsContainingKey = filterKey =>
  filter(Object.keys(groups), groupKey => groups[groupKey].includes(filterKey))

const isFilterKeyInGroupedFilter = (filtersConfig, filterKey) => {
  const filterGroupsContainingKey = getFilterGroupsContainingKey(filterKey)
  const anyGroupsSetInFiltersConfig =
    filter(filterGroupsContainingKey, filterGroupKey => !isNil(findFilterConfigByKey(filtersConfig, filterGroupKey)))
      .length > 0
  return anyGroupsSetInFiltersConfig
}

const defaultSanitizer = ({ a, k, config, dependencies }) => {
  if (!a.value) a.value = new URLSearchParams()
  const { value } = a
  const filterGroupsContainingKey = getFilterGroupsContainingKey(k)

  const filterConfigKey = find(filterGroupsContainingKey, groupKey => findFilterConfigByKey(config, groupKey))

  if (
    (!filterConfigKey ||
      !config[filterConfigKey] ||
      (config[filterConfigKey].isEnabled && !config[filterConfigKey].isEnabled(dependencies))) &&
    nonEmptyFilterValue(value.get(k))
  ) {
    // If there isn't any filter group configured that contains the specified key and the value is set,
    // or the key was configured, but should be enabled,
    // then remove the key from filters
    value.delete(k)
    return {
      sanitized: true,
      value,
    }
  }
  return a
}

const makeArraySanitizer =
  keys =>
  ({ a, config }) =>
    // Removes from the filters only the keys that weren't configured independently
    keys.filter(k => !findFilterConfigByKey(config, k)).reduce((a, k) => defaultSanitizer({ a, k, config }), a)

const makeKeySanitizer =
  k =>
  ({ a, config }) =>
    defaultSanitizer({ a, k, config })

const sanitizerByConfigKey = {
  singleAssayId: defaultSanitizer,
  assayId: defaultSanitizer,
  assayAndResultCategory: makeArraySanitizer(groups.assayAndResultCategory),
  geography: makeArraySanitizer(groups.geography),
  state: defaultSanitizer,
  connectorStatus: defaultSanitizer,
  lga: defaultSanitizer,
  date: makeArraySanitizer(groups.date),
  patientOrResearchId: defaultSanitizer,
  partnerId: defaultSanitizer,
  sampleId: defaultSanitizer,
  errorCode: defaultSanitizer,
  deviceName: defaultSanitizer,
  siteName: defaultSanitizer,
  sampleOriginSite: defaultSanitizer,
  contactNameOrEmail: defaultSanitizer,
  deviceType: defaultSanitizer,
  notificationName: defaultSanitizer,
  externalId: defaultSanitizer,
  revoked: defaultSanitizer,
  reportableSiteName: defaultSanitizer,
  reportableSiteId: defaultSanitizer,
  consumable: makeKeySanitizer('consumableId'),
  deviceApproval: makeKeySanitizer('deviceApprovalExternalId'),
  deviceMaintenanceStatus: makeKeySanitizer('deviceMaintenanceStatusId'),
  onlyEverTransferred: defaultSanitizer,
  onlyReportableResults: defaultSanitizer,
  onlyDownloadedByReporter: defaultSanitizer,
  onlyTreatmentRequired: defaultSanitizer,
  treatmentStatus: defaultSanitizer,
  daysStockLeft: defaultSanitizer,
  hasStock: defaultSanitizer,
  lotNumber: defaultSanitizer,
  contactStatus: defaultSanitizer,
  displayResult: defaultSanitizer,
  onlyTransfers: defaultSanitizer,
  showDecommissionedDevices: defaultSanitizer,
}

/**
 * Creates a function, which receives the current filters string from URL, and the external dependencies used for enabling and disabling filters, 
 * and then returns the filter string after cleaning it all the filters that were not included in the configuration or that should be disabled based on their dependencies.
 * @param {object} config The collection of filter configurations. Ex.: [{
    assayId: true,
    requiredPermissions: ['assay:view'],
  }]
 * @returns the function to sanitize filters, based on the provided configuration
 */
export const sanitizeFiltersStringBy = config => (filtersString, dependencies) =>
  reduce(
    sanitizerByConfigKey,
    (acc, sanitizer, key) => {
      const filterConfig = findFilterConfigByKey(config, key)
      if (
        // if...
        // the filter key was not configured...
        (!filterConfig &&
          // and it is not included in a group of keys (like assayId is included in assayAndResultCategory)...
          !isFilterKeyInGroupedFilter(config, key)) ||
        // or the filter key was configured...
        (filterConfig &&
          // and the filter key should be enabled based on the provided dependencies...
          filterConfig.isEnabled &&
          dependencies &&
          !filterConfig.isEnabled(dependencies))
      ) {
        // then evaluate the sanitization and return the updated collection of filters
        return sanitizer({ a: acc, k: key, config, dependencies })
      }

      return acc
    },
    {
      sanitized: false,
      value: new URLSearchParams(filtersString),
    }
  )

export const getFilters = urlSearchParams => {
  const filters = {}
  urlSearchParams.forEach((value, key) => {
    if (filters[key]) {
      let filter = filters[key]
      filter = isArray(filter) ? filter : [filter]
      filters[key] = [...filter, value]
    } else {
      filters[key] = value
    }
  })
  return filters
}
