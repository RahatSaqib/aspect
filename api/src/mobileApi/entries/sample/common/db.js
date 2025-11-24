const subMonths = require('date-fns/subMonths')
const { knex } = require('../../../../db')
const { MONTHS_HISTORY_TO_LOOK_UP } = require('../../common/consts')
const { addConstraints } = require('../../../../auth/constraints')

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
  const modifiedSince = query?.minUpdatedOn ?? query?.modifiedSince
  const submittedSince = query?.submittedSince ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)
  const knexQuery = getBaseAllSamplesRegistered(originSiteIds).where(queryBuilder =>
    queryBuilder
      .where(qb => qb.where('sample.collectedOn', '>=', submittedSince))
      .andWhere('sample.registeredInMobile', true)
      .andWhere(qb => {
        if (modifiedSince) {
          qb.where('sample.updatedOn', '>=', modifiedSince).orWhereNull('sample.updatedOn')
        }
      })
  )
  return knexQuery
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
  getBaseAllSamplesRegistered,
  getAllSamplesRegistered,
  getTransferHistory,
}
