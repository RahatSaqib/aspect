const _ = require('lodash')
/**
 * @param {Object} knex - knex instance
 * @param {Object} parameters
 * @param {FunctionType} parameters.addConstraints - function to add constraints to query
 * @param {Object} parameters.dataConstraints - user constraints
 * @param {Object} parameters.filterParams - function to add filter params to query
 * @param {Array.<string>} parameters.assay - array of assay externalIds
 * @param {Object} parameters.query - query params
 * @param {string} parameters.timeFrame - timeFrame ['day', 'month']
 * @param {string} parameters.joinSiteWith - join site with ['device' (default), 'result']
 *      Use device when the information needed is regarding operational history of the device.
 *      Use result when the information needed is regarding the test performed the user is authorized to see.
 *      Constraints will be applied to the joined table.
 * @param {Object} opts - show options
 * @param {boolean} opts.showDecommissionedDevices - show decommissioned devices
 * @param {boolean} opts.showUnapprovedDevices - show unapproved devices
 * @returns {Object} - base query without projection. Constraints and filter params are applied.
 */
function getBaseQueryForFactResultsDeviceByTimeFrame(
  knex,
  { addConstraints, dataConstraints, filterParams, assay, query, timeFrame = 'month', joinSiteWith = 'device' },
  opts = {}
) {
  const showDecommissionedDevices = opts.showDecommissionedDevices ?? query.showDecommissionedDevices ?? false
  const showUnapprovedDevices = opts.showUnapprovedDevices ?? query.showUnapprovedDevices ?? false
  const qb = knex('FactResultsDeviceByTimeFrame as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')

  switch (joinSiteWith) {
    case 'result':
      qb.leftJoin('Site as s', 's.id', 'r.siteId')
      break
    default: // device
      qb.innerJoin('Site as s', 's.id', 'd.siteId')
      break
  }

  qb.innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .innerJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .leftOuterJoin('Lga as lg', 'lg.id', 'g.lgaId')
    .leftOuterJoin('ResultCategoryGroup as rcg', join => {
      join.on('r.resultCategory1', 'rcg.resultCategory1Id')
      join.andOn(knex.raw('r.resultCategory2 <=> rcg.resultCategory2Id'))
      join.andOn('r.assayId', 'rcg.assayId')
    })
    .modify(
      addConstraints,
      dataConstraints,
      {
        assay: 'a',
        assayType: 'at',
        device: 'd',
        site: 's',
        geography: 'g',
      },
      { showDecommissionedDevices, showUnapprovedDevices }
    )
    .modify(filterParams, query, {
      assay: 'a.externalId',
      countryId: 'g.countryId',
      partnerId: 'g.partnerId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
    })
    .modify(qb => {
      if (query.minDate) {
        qb.where('r.startedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.startedOn', '<=', query.maxDate)
      }
      if (!query.assay && assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (_.isArray(query.resultCategory1)) {
        qb.whereIn('rc1.externalId', query.resultCategory1)
      } else if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }

      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('r.timeFrame', timeFrame)
    .sum('r.resultCount as cnt')

  return qb
}

function getBaseQueryForFactResults(knex, deviceId, from) {
  return knex('Result as r')
    .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', from)
    .where('rt.excluded', false)
}

module.exports = {
  getBaseQueryForFactResultsDeviceByTimeFrame,
  getBaseQueryForFactResults,
}
