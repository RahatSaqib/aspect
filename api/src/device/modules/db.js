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
 * @param {boolean} opts.showDecommissionedDevices - Whether to show decommissioned devices (default: false).
 * @param {boolean} opts.showUnapprovedDevices - Whether to show unapproved devices (default: false).
 * @returns {Object} - The Knex query builder object.
 */
function getResultsWithinTimeFrame(knex, { addConstraints, dataConstraints, filterParams, query }, opts) {
  const { showDecommissionedDevices = false, showUnapprovedDevices = false } = opts || {}
  const queryBuilder = knex('Result as r')
    .leftJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .leftOuterJoin('Lga as lg', 'lg.id', 'g.lgaId')

  queryBuilder
    .modify(
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
    .select('lg.name as district', 'st.name as zone', 's.name as deploymentName')
    .select(knex.raw('DATE(r.startedOn) as dateOfError'))

  return queryBuilder
}

module.exports = {
  getResultsWithinTimeFrame,
}
