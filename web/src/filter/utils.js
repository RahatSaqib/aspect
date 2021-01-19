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
  assayAndResultCategory: makeArraySanitizer([
    'assayId',
    'resultCategoryId',
    'resultCategoryGroupId',
    'diseaseId',
  ]),
  geography: makeArraySanitizer(['countryId', 'stateId', 'lgaId']),
  state: identity,
  lga: identity,
  date: makeArraySanitizer(['minDate', 'maxDate']),
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
  consumable: makeKeySanitizer('consumableId'),
  workflowStatus: makeKeySanitizer('workflowStatusId'),
  deviceApproval: makeKeySanitizer('deviceApprovalId'),
  deviceMaintenanceStatus: makeKeySanitizer('deviceMaintenanceStatusId'),
}

export const sanitizeFiltersStringBy = config => filtersString =>
  reduce(
    sanitizerByConfigKey,
    (acc, sanitizer, key) => {
      if (find(config, configObject => configObject[key]) || config[key]) {
        return acc
      }
      return sanitizer(acc, key)
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
        })
      else if (isPermitted && source.href) {
        if (source.href === '/browse') {
          const filteredSource = sanitizeBrowseLink(userPermissions)
          if (filteredSource) {
            result.push({
              href: filteredSource.value,
              label: source.label,
            })
          }
        } else
          result.push({
            href: source.href,
            label: source.label,
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
              result.assayAndResultCategory = true
              break
            case 'assayAndResultCategoryGroup':
              result.assayAndResultCategoryGroup = true
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
            case 'issueTypeId':
              result.issueTypeId = true
              break
            case 'onlyOpenIssues':
              result.onlyOpenIssues = true
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
