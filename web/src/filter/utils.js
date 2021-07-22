import isNull from 'lodash/isNull'
import isUndefined from 'lodash/isUndefined'
import reduce from 'lodash/reduce'
import identity from 'lodash/identity'
import filter from 'lodash/filter'
import intersection from 'lodash/intersection'
import flowRight from 'lodash/flowRight'
import mapKeys from 'lodash/mapKeys'
import find from 'lodash/find'
import {
  getPermissions,
  groupByPermissionTypes,
  isPermittedUser,
} from '../components/shared/requirePermissions'
import { navigations } from '../globals/components/BrowseFilters'

export function nonEmptyFilterValue(x) {
  return !isNull(x) && !isUndefined(x) && x !== ''
}

export const mergeToFiltersParams = (filters, filtersParams) => {
  return reduce(
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
}

const groups = {
  assayAndResultCategory: [
    'assayId',
    'resultCategoryId',
    'resultCategoryGroupId',
    'diseaseId',
  ],
  geography: ['countryId', 'stateId', 'lgaId'],
  date: ['minDate', 'maxDate'],
}

const findFilterConfigByKey = (config, key) =>
  find(config, configObject => configObject[key]) && !config[key]

const defaultSanitizer = ({ a, k, config }) => {
  if (!a.value) a.value = new URLSearchParams()
  const { value } = a
  const filterGroupsContainingKey = filter(Object.keys(groups), groupKey =>
    groups[groupKey].includes(k)
  )
  if (
    !find(filterGroupsContainingKey, groupKey =>
      findFilterConfigByKey(config, groupKey)
    ) &&
    nonEmptyFilterValue(value.get(k))
  ) {
    // If there isn't any filter group configured that contains the specified key and the value is set, then remove the key from filters
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
    keys
      .filter(k => !findFilterConfigByKey(config, k))
      .reduce((a, k) => defaultSanitizer({ a, k, config }), a)

const makeKeySanitizer =
  k =>
  ({ a, config }) =>
    defaultSanitizer({ a, k, config })

const sanitizerByConfigKey = {
  assayId: defaultSanitizer,
  assayAndResultCategory: makeArraySanitizer(groups.assayAndResultCategory),
  geography: makeArraySanitizer(groups.geography),
  state: identity,
  lga: identity,
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
  consumable: makeKeySanitizer('consumableId'),
  workflowStatus: makeKeySanitizer('workflowStatusId'),
  deviceApproval: makeKeySanitizer('deviceApprovalId'),
  deviceMaintenanceStatus: makeKeySanitizer('deviceMaintenanceStatusId'),
  onlyEverTransferred: defaultSanitizer,
  onlyReportableResults: defaultSanitizer,
  onlyDownloadedByReporter: defaultSanitizer,
  onlyTreatmentRequired: defaultSanitizer,
  treatmentStatus: defaultSanitizer,
}

export const sanitizeFiltersStringBy = config => filtersString =>
  reduce(
    sanitizerByConfigKey,
    (acc, sanitizer, key) => {
      if (findFilterConfigByKey(config, key)) {
        return acc
      }
      return sanitizer({ a: acc, k: key, config })
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

  const source = filter(
    navigations,
    link => intersection(link.requiredPermissions, permissions).length >= 1
  )
  return source.length >= 1 ? source[0] : false
}

export const reduceNavLinks = (linkArray, userPermissions) => {
  const reducedNav = reduce(
    linkArray,
    (result, source) => {
      const permissionsByTypes = flowRight([
        groupByPermissionTypes,
        getPermissions,
      ])(source.requiredPermissions, [], [])

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

export const reduceFiltersConfig = (configObject, userPermissions) => {
  const reducedFilters = reduce(
    configObject,
    (result, source) => {
      const permissionsByTypes = flowRight([
        groupByPermissionTypes,
        getPermissions,
      ])(source.requiredPermissions, [], [])

      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)
      if (isPermitted) {
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
            case 'stockLeft':
              result.stockLeft = true
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
            default:
          }
        })
      }
      return result
    },
    {}
  )
  return reducedFilters
}
