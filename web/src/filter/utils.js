import _ from 'lodash'
import {
  getPermissions,
  groupByPermissionTypes,
  isPermittedUser,
} from '../components/shared/requirePermissions'
import { navigations } from '../globals/components/BrowseFilters'

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
      if (_.find(config, configObject => configObject[key]) || config[key]) {
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
  const permissions = userPermissions.toJS()
  const source = _.filter(
    navigations,
    link => _.intersection(link.requiredPermissions, permissions).length >= 1
  )
  return source.length >= 1 ? source[0] : false
}

export const reduceNavLinks = (linkArray, userPermissions) => {
  const reducedNav = _.reduce(
    linkArray,
    (result, source) => {
      const permissionsByTypes = _.flowRight([
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
        } else {
          result.push({
            href: source.href,
            label: source.label,
          })
        }
      }
      return result
    },
    []
  )
  return reducedNav
}

export const reduceFiltersConfig = (configObject, userPermissions) => {
  const reducedFilters = _.reduce(
    configObject,
    (result, source) => {
      const permissionsByTypes = _.flowRight([
        groupByPermissionTypes,
        getPermissions,
      ])(source.requiredPermissions, [], [])

      const isPermitted = isPermittedUser(userPermissions, permissionsByTypes)
      if (isPermitted) {
        _.mapKeys(source, (value, key) => {
          switch (key) {
            case 'assayAndResultCategory':
              result.assayAndResultCategory = true
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
            case 'date':
              result.date = true
              break
            case 'deviceName':
              result.deviceName = true
              break
            case 'deviceStatus':
              result.deviceStatus = true
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
            case 'sampleId':
              result.sampleId = true
              break
            case 'sampleGroup':
              result.sampleGroup = true
              break
            case 'sampleOriginSite':
              result.sampleOriginSite = true
              break
            case 'workflowStatus':
              result.workflowStatus = true
              break
            case 'contactNameOrEmail':
              result.contactNameOrEmail = true
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
