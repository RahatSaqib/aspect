const { knex } = require('../../../../db')

const getBaseAllSamplesRegistered = () => {
  // TODO: add constraints
  const knexQuery = knex('Sample as sample')
    .select(
      'sample.collectedOn as collectedOn',
      'sample.externalId as externalId',
      'sample.externalId as sampleExternalId',
      'sample.id as id',
      'sample.id as sampleId',
      'sample.sampleStatus as sampleStatus',
      'sample.updatedOn as sampleUpdatedOn',
      'sample.collectedOn as sampleCollectedOn',
      'sample_site.externalId as sampleSiteExternalId',
      'sample_site.id as sampleSiteId',
      'sample_site.name as sampleSiteName',
      'sample_type.externalId as sampleTypeExternalId',
      'sample_type.i18nKey as sampleTypeI18nKey',
      'sample_type.name as sampleTypeName'
    )
    .leftJoin('SampleType as sample_type', 'sample.sampleTypeId', 'sample_type.id')
    .leftJoin('Site as sample_site', 'sample.originSiteId', 'sample_site.id')
  return knexQuery
}
const getAllSamplesRegistered = query => {
  // TODO: add constraints
  const knexQuery = getBaseAllSamplesRegistered().where('sample.collectedOn', '>=', query?.minUpdatedOn || new Date())
  return knexQuery
}

const getSamplesRegisteredById = sampleId => {
  const knexQuery = getBaseAllSamplesRegistered().where({ 'sample.id': sampleId })
  return knexQuery
}

const insertNewSample = payload =>
  knex('Sample')
    .insert({ ...payload })
    .then(newSample => getSamplesRegisteredById(newSample[0]).first())

module.exports = { getAllSamplesRegistered, insertNewSample }
