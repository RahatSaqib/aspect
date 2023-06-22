const subMonths = require('date-fns/subMonths')
const { knex } = require('../../../../db')
const { addConstraints, getConstraints } = require('../../../../auth/constraints')
const { MONTHS_HISTORY_TO_LOOK_UP } = require('../../common/consts')

const getBaseAllSamplesRegistered = dataConstraints => {
  const knexQuery = knex('Sample as sample')
    .select(
      'sample.id as id',
      'sample.collectedOn as collectedOn',
      'sample.externalId as externalId',
      'sample.externalId as sampleExternalId',
      'sample.id as sampleId',
      'sample.sampleStatus as sampleStatus',
      'sample.updatedOn as sampleUpdatedOn',
      'sample.collectedOn as sampleCollectedOn',
      'sample.collectedBy as sampleCollectedBy',
      'sample.sampleData as sampleData',
      'sample.sampleTypeId',
      'sampleOriginSite.externalId as sampleSiteExternalId',
      'sampleOriginSite.id as sampleSiteId',
      'sampleOriginSite.name as sampleSiteName',
      'sampleType.externalId as sampleTypeExternalId',
      'sampleType.i18nKey as sampleTypeI18nKey',
      'sampleType.name as sampleTypeName'
    )
    .leftJoin('SampleType as sampleType', 'sample.sampleTypeId', 'sampleType.id')
    .leftJoin('Site as sampleOriginSite', 'sample.originSiteId', 'sampleOriginSite.id')
    .leftJoin('Geography as geography', 'sampleOriginSite.geographyId', 'geography.id')
    .modify(addConstraints, dataConstraints, {
      site: 'sampleOriginSite',
      sample: 'sample',
      geography: 'geography',
    })
  return knexQuery
}

const getAllSamplesRegistered = (query, dataConstraints) => {
  const minUpdatedOn = query?.minUpdatedOn ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)
  const knexQuery = getBaseAllSamplesRegistered(dataConstraints).where(queryBuilder =>
    queryBuilder.where('sample.collectedOn', '>=', minUpdatedOn).orWhere('sample.updatedOn', '>=', minUpdatedOn)
  )
  return knexQuery
}

const getSamplesRegisteredById = async (sampleId, auth) => {
  const dataConstraints = await getConstraints(auth.credentials)
  const knexQuery = getBaseAllSamplesRegistered(dataConstraints).where({ 'sample.id': sampleId })
  return knexQuery
}

const getSamplesRegisteredAtSiteOnDayWithSampleId = async (
  sampleExternalId,
  sampleTypeId,
  collectedOn,
  originSiteId,
  dataConstraints
) => {
  const knexQuery = getBaseAllSamplesRegistered(dataConstraints).modify(qb => {
    qb.where({
      'sample.externalId': sampleExternalId,
      'sample.originSiteId': originSiteId,
    })
    if (sampleTypeId) {
      qb.andWhere(sampleTypeIdQb =>
        sampleTypeIdQb.whereNull('sample.sampleTypeId').orWhere('sample.sampleTypeId', sampleTypeId)
      )
    }
    if (collectedOn) {
      qb.andWhere(collectedOnQb =>
        collectedOnQb.whereNull('sample.collectedOn').orWhere('sample.collectedOn', collectedOn)
      )
    }
  })
  return knexQuery
}

const updateExistingSample = (sampleId, payload, auth) =>
  knex('Sample')
    .where('id', sampleId)
    .update(payload)
    .then(() => getSamplesRegisteredById(sampleId, auth))

const insertNewSample = (payload, auth) =>
  knex('Sample')
    .insert({ ...payload })
    .then(async newSample => getSamplesRegisteredById(newSample[0], auth))

module.exports = {
  getAllSamplesRegistered,
  updateExistingSample,
  insertNewSample,
  getSamplesRegisteredAtSiteOnDayWithSampleId,
}
