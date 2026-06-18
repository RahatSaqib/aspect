const _ = require('lodash')

function isShowResultsFromUndeployedDevices(query) {
  const value = query.showResultsFromUndeployedDevices
  return value === true || value === 'true' || value === 1 || value === '1'
}

function getUndeployedDevicesPartnerQueryOptions(query) {
  return { showResultsFromUndeployedDevices: isShowResultsFromUndeployedDevices(query) }
}

function applyShowResultsFromUndeployedDevicesFilter(queryBuilder, query) {
  if (!isShowResultsFromUndeployedDevices(query)) {
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
  if (!isShowResultsFromUndeployedDevices(query)) {
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
  const showResultsFromUndeployedDevices = isShowResultsFromUndeployedDevices(query)
  const { showUnapprovedDevices = false, showDecommissionedDevices = false } = query
  const displayResult = query.displayResult || 'actual'

  return {
    displayResult,
    showUnapprovedDevices: showUnapprovedDevices || showResultsFromUndeployedDevices,
    showDecommissionedDevices: showDecommissionedDevices || showResultsFromUndeployedDevices,
  }
}

module.exports = {
  applyGeographyFilterIncludingUndeployed,
  applyShowResultsFromUndeployedDevicesFilter,
  getResultListConstraintOptions,
  getUndeployedDevicesPartnerQueryOptions,
  isShowResultsFromUndeployedDevices,
  withUndeployedAwareGeographyFilters,
}
