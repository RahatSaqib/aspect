const subMonths = require('date-fns/subMonths')
const addDays = require('date-fns/addDays')
const { format } = require('date-fns')
const { knex } = require('../../../../db')
const { MONTHS_HISTORY_TO_LOOK_UP } = require('../../common/consts')
const { getConstraints, addConstraints } = require('../../../../auth/constraints')
const { getSitesQuery } = require('../../../../site/service')

const getBaseAllSamplesRegistered = originSiteIds => {
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
      'state.name as sampleSiteStateName',
      'sampleType.externalId as sampleTypeExternalId',
      'sampleType.i18nKey as sampleTypeI18nKey',
      'sampleType.name as sampleTypeName'
    )
    .leftJoin('SampleType as sampleType', 'sample.sampleTypeId', 'sampleType.id')
    .leftJoin('Site as sampleOriginSite', 'sample.originSiteId', 'sampleOriginSite.id')
    .leftJoin('Geography as geography', 'sampleOriginSite.geographyId', 'geography.id')
    .leftJoin('State as state', 'geography.stateId', 'state.id')
    .whereIn('sample.originSiteId', originSiteIds)
  return knexQuery
}

const getAllSamplesRegistered = (query, originSiteIds) => {
  const minUpdatedOn = query?.minUpdatedOn ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)
  const knexQuery = getBaseAllSamplesRegistered(originSiteIds).where(queryBuilder =>
    queryBuilder
      .where(qb => qb.where('sample.collectedOn', '>=', minUpdatedOn).orWhere('sample.updatedOn', '>=', minUpdatedOn))
      .andWhere('sample.registeredInAspect', true)
  )
  return knexQuery
}

const getSamplesRegisteredById = async (sampleId, originSiteIds) => {
  const knexQuery = getBaseAllSamplesRegistered(originSiteIds).where({ 'sample.id': sampleId })
  return knexQuery
}

const getSamplesRegisteredAtSiteOnDayWithSampleId = async (
  sampleExternalId,
  sampleTypeId,
  collectedOn,
  originSiteId,
  originSiteIds
) => {
  const knexQuery = getBaseAllSamplesRegistered(originSiteIds).modify(qb => {
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
        collectedOnQb
          .whereNull('sample.collectedOn')
          .orWhere(collectedOnQbBetween =>
            collectedOnQbBetween.whereBetween('sample.collectedOn', [
              format(collectedOn, 'yyyy-MM-dd'),
              format(addDays(collectedOn, 1), 'yyyy-MM-dd'),
            ])
          )
      )
    }
  })
  return knexQuery
}

const getSiteIdsForUser = async auth => {
  const dataConstraints = await getConstraints(auth.credentials)
  const clinics = await getSitesQuery(dataConstraints).select('s.id')
  return clinics.map(c => c.id)
}

const updateExistingSample = async (sampleId, payload, auth) => {
  await knex('Sample').where('id', sampleId).update(payload)
  const clinicIds = await getSiteIdsForUser(auth)
  return getSamplesRegisteredById(sampleId, clinicIds)
}

const insertNewSample = async (payload, auth) => {
  const [newSampleId] = await knex('Sample').insert({ ...payload })
  const clinicIds = await getSiteIdsForUser(auth)
  return getSamplesRegisteredById(newSampleId, clinicIds)
}

const getTransferHistory = dataConstraints => {
  const query = knex
    .distinct('resultId')
    .from('ResultTransferLog as transferLog')
    .modify(addConstraints, dataConstraints, {
      transferLog: 'transferLog',
    })
  return query
}

module.exports = {
  getAllSamplesRegistered,
  getSamplesRegisteredAtSiteOnDayWithSampleId,
  updateExistingSample,
  insertNewSample,
  getTransferHistory,
}
