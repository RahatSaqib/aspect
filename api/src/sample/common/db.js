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
 * Retrieves a mobile sample by its external ID, if it exists.
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
 * Finds an existing sample by external ID for non–mobile-format IDs, optionally scoped to an origin site.
 * @param {Object} knex - The Knex database instance
 * @param {string} sampleExternalId - The external ID of the sample to search for
 * @param {Date} testStartedOn - The timestamp to filter samples by collection date
 * @param {number|null|undefined} originSiteId - When set, only samples with this `Sample.originSiteId` are considered (device site or payload `sample.originSite`). When null/undefined, no site filter is applied (legacy edge cases).
 * @returns {Promise<Object|null>} The only matching sample if found, null otherwise
 *
 * @description
 * Searches for samples that match the external ID and `collectedOn` constraint. When `originSiteId`
 * is provided, candidates are restricted to that origin site so the same barcode at different sites
 * does not collapse onto one sample.
 *
 * - Returns a single match if only one exists among candidates
 * - Returns null if zero or multiple candidates
 */
async function getMatchingSample(knex, sampleExternalId, testStartedOn, originSiteId) {
  const MINIMUM_SAMPLEID_LENGTH_FOR_CONSIDER_IT_AS_NOT_DUMMY = 7
  if (!sampleExternalId || sampleExternalId.length < MINIMUM_SAMPLEID_LENGTH_FOR_CONSIDER_IT_AS_NOT_DUMMY) {
    return Promise.resolve(null)
  }

  const query = knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', sampleExternalId)

  if (originSiteId != null) {
    query.where('s.originSiteId', originSiteId)
  }

  query
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
