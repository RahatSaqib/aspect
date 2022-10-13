import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import subtractDays from 'date-fns/subDays'
import filter from 'lodash/filter'
import find from 'lodash/find'
import flowRight from 'lodash/flowRight'
import intersection from 'lodash/intersection'
import isArray from 'lodash/isArray'
import isNil from 'lodash/isNil'
import isNull from 'lodash/isNull'
import isUndefined from 'lodash/isUndefined'
import mapKeys from 'lodash/mapKeys'
import reduce from 'lodash/reduce'
import { navigations } from '../BrowseFilters'
import { getPermissions, groupByPermissionTypes, isPermittedUser } from '../shared/requirePermissions'

export function nonEmptyFilterValue(x) {
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
  assayId: defaultSanitizer,
  assayAndResultCategory: makeArraySanitizer(groups.assayAndResultCategory),
  geography: makeArraySanitizer(groups.geography),
  state: defaultSanitizer,
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
  notificationName: defaultSanitizer,
  externalId: defaultSanitizer,
  revoked: defaultSanitizer,
  reportableSiteName: defaultSanitizer,
  reportableSiteId: defaultSanitizer,
  workflowStatus: makeKeySanitizer('workflowStatusId'),
  consumable: makeKeySanitizer('consumableId'),
  deviceApproval: makeKeySanitizer('deviceApprovalId'),
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
}

export const setFiltersForLast30Days = searchParams => {
  const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
  if (!filtersParams.has('minDate') && !filtersParams.has('maxDate')) {
    const now = new Date()
    const last30DaysStart = subtractDays(now, 30)
    const minDate = startOfDay(last30DaysStart)
    const maxDate = endOfDay(now)
    filtersParams.set('minDate', minDate.toJSON())
    filtersParams.set('maxDate', maxDate.toJSON())
    searchParams.set('filters', filtersParams)
  }
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

const sanitizeBrowseLink = userPermissions => {
  const permissions = []

  userPermissions.toJS().forEach(permission => {
    permissions.push(permission)
    if (permission.includes(':')) {
      const splittedPermission = permission.split(':')
      const permissionModule = splittedPermission[0]
      permissions.push(permissionModule)
    }
  })

  const source = filter(navigations, link => intersection(link.requiredPermissions, permissions).length >= 1)
  return source.length >= 1 ? source[0] : false
}

export const reduceNavLinks = (linkArray, userPermissions) => {
  const reducedNav = reduce(
    linkArray,
    (result, source) => {
      const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(source.requiredPermissions, [], [])

      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)

      if (isPermitted && source.value)
        result.push({
          value: source.value,
          label: source.label,
          i18nKey: source.i18nKey,
        })
      else if (isPermitted && source.href) {
        if (source.href === '/browse') {
          const filteredSource = sanitizeBrowseLink(userPermissions)
          if (filteredSource) {
            result.push({
              href: filteredSource.value,
              label: source.label,
              i18nKey: source.i18nKey,
            })
          }
        } else
          result.push({
            href: source.href,
            label: source.label,
            i18nKey: source.i18nKey,
          })
      }
      return result
    },
    []
  )
  return reducedNav
}

export const reduceFiltersConfig = (configObject, userPermissions, dependencies) => {
  const reducedFilters = reduce(
    configObject,
    (result, source) => {
      const permissionsByTypes = flowRight([groupByPermissionTypes, getPermissions])(source.requiredPermissions, [], [])

      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)
      const isEnabled = !source.isEnabled || source.isEnabled(dependencies)
      if (isPermitted && isEnabled) {
        mapKeys(source, (value, key) => {
          switch (key) {
            case 'assayAndResultCategory':
              result.assayId = true
              result.diseaseId = true
              result.resultCategory = true
              result.resultCategoryGroup = true
              break
            case 'geography':
              result.geography = true
              break
            case 'state':
              result.state = true
              break
            case 'siteName':
              result.siteName = true
              break
            case 'reportableSiteName':
              result.reportableSiteName = true
              break
            case 'reportableSiteId':
              result.reportableSiteId = true
              break
            case 'siteId':
              result.siteId = true
              break
            case 'date':
              result.date = true
              break
            case 'deviceName':
              result.deviceName = true
              break
            case 'deviceApproval':
              result.deviceApproval = true
              break
            case 'connectorStatus':
              result.connectorStatus = true
              break
            case 'deviceStatus':
              result.deviceStatus = true
              break
            case 'deviceMaintenanceStatus':
              result.deviceMaintenanceStatus = true
              break
            case 'deviceType':
              result.deviceType = true
              break
            case 'externalId':
              result.externalId = true
              break
            case 'lga':
              result.lga = true
              break
            case 'patientOrResearchId':
              result.patientOrResearchId = true
              break
            case 'patientOrCaseId':
              result.patientOrCaseId = true
              break
            case 'sampleId':
              result.sampleId = true
              break
            case 'errorCode':
              result.errorCode = true
              break
            case 'sampleOriginSite':
              result.sampleOriginSite = true
              break
            case 'workflowStatus':
              result.workflowStatus = true
              break
            case 'treatmentStatus':
              result.treatmentStatus = true
              break
            case 'contactNameOrEmail':
              result.contactNameOrEmail = true
              break
            case 'notificationName':
              result.notificationName = true
              break
            case 'revoked':
              result.revoked = true
              break
            case 'onlyDisease':
              result.onlyDisease = true
              break

            case 'onlyReportableResults':
              result.onlyReportableResults = true
              break
            case 'onlyDownloadedByReporter':
              result.onlyDownloadedByReporter = true
              break
            case 'onlyEverTransferred':
              result.onlyEverTransferred = true
              break
            case 'onlyTreatmentRequired':
              result.onlyTreatmentRequired = true
              break
            case 'issueTypeId':
              result.issueTypeId = true
              break
            case 'onlyOpenIssues':
              result.onlyOpenIssues = true
              break
            case 'daysStockLeft':
              result.daysStockLeft = true
              break
            case 'hasStock':
              result.hasStock = true
              break
            case 'consumable':
              result.consumable = true
              break
            case 'assayId':
              result.assayId = true
              break
            case 'reportName':
              result.reportName = true
              break
            case 'lotNumber':
              result.lotNumber = true
              break
            case 'diseaseId':
              result.disease = true
              break
            case 'contactStatus':
              result.contactStatus = true
              break
            case 'onlyTransfers':
              result.onlyTransfers = true
              break
            case 'expirationDate':
              result.expirationDate = true
              break
            case 'displayResult':
              result.displayResult = true
              break
            default:
              break
          }
        })
      }
      return result
    },
    {}
  )
  return reducedFilters
}

export const isCountryFilterHidden = countries =>
  countries.loading === false && !!countries.lastRefreshed && countries.items.size === 1

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
