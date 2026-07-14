const _ = require('lodash')

function isShowUndeployedDevices(query) {
  const value = query.showUndeployedDevices
  return value === true || value === 'true' || value === 1 || value === '1'
}

function getUndeployedDevicesPartnerQueryOptions(query) {
  return { showUndeployedDevices: isShowUndeployedDevices(query) }
}

function applyUndeployedDevicesResultFilter(queryBuilder, query) {
  if (!isShowUndeployedDevices(query)) {
    queryBuilder.whereNotNull('r.siteId')
  }
}

function applyGeographyFilterIncludingUndeployed(queryBuilder, columnName, paramValue) {
  queryBuilder.where(qb => {
    qb.where(subQb => {
      if (_.isString(paramValue)) {
        subQb.where(columnName, 'like', `%${paramValue}%`)
      } else if (_.isArray(paramValue)) {
        subQb.whereIn(columnName, paramValue)
      } else {
        subQb.where(columnName, paramValue)
      }
    }).orWhereNull('r.siteId')
  })
}

function withUndeployedAwareGeographyFilters(filters, query) {
  if (!isShowUndeployedDevices(query)) {
    return filters
  }

  const geographyParams = ['countryId', 'stateId', 'lgaId', 'siteName']
  const result = { ...filters }

  geographyParams.forEach(paramName => {
    const columnName = result[paramName]
    if (columnName) {
      result[paramName] = (queryBuilder, paramValue) =>
        applyGeographyFilterIncludingUndeployed(queryBuilder, columnName, paramValue)
    }
  })

  return result
}

function getResultListConstraintOptions(query) {
  // showUndeployedDevices is the single flag governing undeployed (pendingDeployment) devices
  // and their results (null siteId). Decommissioned devices are a separate concern gated only
  // by showDecommissionedDevices — they always have a site, so the null-site filter never hides them.
  const { showDecommissionedDevices = false } = query
  const displayResult = query.displayResult || 'actual'

  return {
    displayResult,
    showUndeployedDevices: isShowUndeployedDevices(query),
    showDecommissionedDevices,
  }
}

module.exports = {
  applyGeographyFilterIncludingUndeployed,
  applyUndeployedDevicesResultFilter,
  getResultListConstraintOptions,
  getUndeployedDevicesPartnerQueryOptions,
  isShowUndeployedDevices,
  withUndeployedAwareGeographyFilters,
}
