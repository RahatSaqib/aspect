const SAMPLE_PROJECTION = [
  's.id',
  's.collectedOn',
  's.externalId',
  's.sampleTypeId',
  's.originSiteId',
  's.sampleData',
  's.sampleStatus',
  's.collectedBy',
  's.registeredInMobile',
  'st.externalId as sampleTypeExternalId',
]

/**
 * Retrieves a mobile sample by its external ID and country, if it exists.
 *
 * @param {Object} knex - The Knex database instance.
 * @param {string} externalId - The external ID of the sample to search for.
 * @returns {Promise<Object|null>} The matching sample object if found, otherwise null.
 */
const getMobileSampleByExternalId = (knex, externalId) => {
  const query = knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', externalId)
    .orderBy('s.collectedOn', 'desc')

  return query.first(SAMPLE_PROJECTION)
}

/**
 * Finds an existing unique sample ID in a specific country.
 * @param {Object} knex - The Knex database instance
 * @param {string} sampleExternalId - The external ID of the sample to search for
 * @param {Date} testStartedOn - The timestamp to filter samples by collection date
 * @returns {Promise<Object|null>} The only matching sample if found, null otherwise
 *
 * @description
 * This function searches for an existing unique sample in the database that matches the given criteria:
 * 1. Has the specified external ID
 * 2. Belongs to the specified country
 *
 * - Returns a single match if only one exists
 * - Return null if the match is not a single match (zero or multiple samples found)
 */
async function getMatchingSample(knex, sampleExternalId, testStartedOn) {
  const MINIMUM_SAMPLEID_LENGTH_FOR_CONSIDER_IT_AS_NOT_DUMMY = 7
  if (!sampleExternalId || sampleExternalId.length < MINIMUM_SAMPLEID_LENGTH_FOR_CONSIDER_IT_AS_NOT_DUMMY) {
    return Promise.resolve(null)
  }

  const query = knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', sampleExternalId)
    .andWhere(qb => qb.whereNull('s.collectedOn').orWhere('s.collectedOn', '<=', testStartedOn))
    .orderBy('s.collectedOn', 'desc')

  const candidatesSamples = await query.select(SAMPLE_PROJECTION)

  if (candidatesSamples.length === 1) {
    return candidatesSamples[0]
  }
  return null
}

module.exports = {
  getMobileSampleByExternalId,
  getMatchingSample,
}
