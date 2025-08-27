const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function listSamples(request) {
  const { query, auth } = request

  // Get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // Base query for samples
  const sampleQuery = knex('Sample as s')
    .leftJoin('Site as site', 's.originSiteId', 'site.id')
    .leftJoin('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Person as collector', 's.collectedBy', 'collector.userId')
    .leftJoin('Result as r', 's.id', 'r.sampleId')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('s.registeredInAspect', 1)
    .modify(addConstraints, dataConstraints, {
      site: 'site',
      geography: 'g',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteId: 'site.id',
      sampleId: 's.externalId',
      patientId: knex.raw(`
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")),
          JSON_UNQUOTE(JSON_EXTRACT(s.sampleData, "$.patientExternalId"))
        )
      `),
    })
    .where(function () {
      if (query.minDate && query.maxDate) {
        this.whereBetween('s.collectedOn', [query.minDate, query.maxDate])
      }
      if (query.sampleId) {
        this.where('s.externalId', query.sampleId)
      }
      if (query.patientId) {
        this.whereRaw(
          `COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")),
            JSON_UNQUOTE(JSON_EXTRACT(s.sampleData, "$.patientExternalId"))
          ) = ?`,
          [query.patientId]
        )
      }
    })

  // Get count
  const getCount = knex
    .count('sampleId as count')
    .from(sampleQuery.clone().select('s.id as sampleId').distinct().as('innerQuery'))
    .first()

  // Get rows with pagination and sorting
  const getItems = sampleQuery
    .clone()
    .modify(sortPageParams, query, 's.collectedOn')
    .select(
      's.id as sampleId',
      's.externalId as sampleExternalId',
      's.collectedOn as sampleCollectedOn',
      'site.name as sampleCollectionSite',
      'collector.name as sampleCollectedBy',
      knex.raw(`
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")),
          JSON_UNQUOTE(JSON_EXTRACT(s.sampleData, "$.patientExternalId"))
        ) as patientId
      `),
      's.updatedOn as dateUploadedToAspect',
      'r.id as resultId',
      'r.endedOn as resultDate',
      knex.raw(
        `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
      )
    )

  // Execute both queries
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return {
    ok: true,
    total,
    length: data.length,
    data,
  }
}

module.exports = {
  listSamples,
}
