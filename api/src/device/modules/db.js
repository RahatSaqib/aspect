/**
 * Retrieves results by module errors within a specified time frame.
 *
 * @param {Object} knex - The Knex instance for database querying.
 * @param {Object} options - The options for customizing the query.
 * @param {Function} options.addConstraints - The function for adding additional constraints to the query.
 * @param {Function} options.dataConstraints - The function for adding data constraints to the query.
 * @param {Function} options.filterParams - The function for filtering query parameters.
 * @param {Object} query - The query parameters.
 * @param {string} query.minDate - The minimum date for filtering results.
 * @param {string} query.maxDate - The maximum date for filtering results.
 * @param {Object} opts - The additional options for customizing the query.
 * @param {string[]} opts.deviceApprovals - DeviceApproval tokens the query may see; falls back
 *  to the wire-level query flags (showUndeployedDevices / showDecommissionedDevices).
 * @returns {Object} - The Knex query builder object.
 */
function getResultsWithinTimeFrame(knex, { addConstraints, dataConstraints, filterParams, query }, opts = {}) {
  // The wire-level query flags act as fallback when the caller does not pass the token set.
  const deviceApprovals = opts.deviceApprovals ?? ['approved']
  if (!opts.deviceApprovals) {
    if (query.showUndeployedDevices) deviceApprovals.push('pendingDeployment')
    if (query.showDecommissionedDevices) deviceApprovals.push('decommissioned')
  }
  const queryBuilder = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('ResultSource as rso', 'r.resultSourceId', 'rso.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftJoin('Site as s', 's.id', 'r.siteId')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'st.id', 'g.stateId')
    .leftJoin('Lga as lg', 'lg.id', 'g.lgaId')

  queryBuilder
    .modify(
      addConstraints,
      dataConstraints,
      {
        site: 's',
        geography: 'g',
      },
      { deviceApprovals }
    )
    .modify(filterParams, query, {
      assay: 'a.externalId',
      countryId: 'g.countryId',
      partnerId: 'g.partnerId',
      stateId: 'g.stateId',
      errorCode: 'r.errorCode',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
    })
    .where('r.endedOn', '>=', query.minDate)
    .where('r.endedOn', '<=', query.maxDate)
    .select(
      'r.siteId as siteId',
      'moduleName',
      'moduleSerial',
      'instrumentSerial',
      'errorCode',
      'r.errorNotes as errorDescription'
    )
    .select('lg.name as district', 'st.name as zone', 's.name as deploymentName')
    .select(knex.raw('DATE_FORMAT(r.startedOn, GET_FORMAT(DATETIME, "ISO")) as dateOfError'))
    .orderBy('deploymentName', 'moduleName')

  return queryBuilder
}

module.exports = {
  getResultsWithinTimeFrame,
}
