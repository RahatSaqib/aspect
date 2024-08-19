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
function getResultsByModuleErrorsWithinTimeFrame(knex, { addConstraints, dataConstraints, filterParams, query }, opts) {
  const { showDecommissionedDevices = false, showUnapprovedDevices = false } = opts || {}
  const qb = knex('Result as r')
    .leftJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .leftOuterJoin('Lga as lg', 'lg.id', 'g.lgaId')

  qb.modify(
    addConstraints,
    dataConstraints,
    {
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
    .where('r.startedOn', '>=', query.minDate)
    .where('r.startedOn', '<=', query.maxDate)
    .select('moduleName', 'moduleSerial', 'instrumentSerial', 'errorCode', 'r.errorNotes as errorDescription')
    .select(knex.raw('DATE(r.startedOn) as dateOfError'))
    .select(knex.raw('COUNT(r.id) as totalTests'))
    .groupBy('r.id')
    .select(knex.raw('SUM(CASE WHEN r.errorCode IS NOT NULL THEN 1 ELSE 0 END) as totalErrors'))
    .select('lg.name as district', 'st.name as zone', 's.name as deploymentName')

  return qb
}

module.exports = {
  getResultsByModuleErrorsWithinTimeFrame,
}
