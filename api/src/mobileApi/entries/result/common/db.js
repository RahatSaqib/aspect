const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const { knex } = require('../../../../db')
const { MONTHS_HISTORY_TO_LOOK_UP, deliverableResultWorkflowStatuses } = require('../../common/consts')
const { addConstraints } = require('../../../../auth/constraints')

const fetchResultsByUpdatedOnQuery = (query, dataConstraints) => {
  const minUpdatedOn = query?.minUpdatedOn ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)

  const knexQuery = knex('Result as result')
    .join('Device as device', 'result.deviceId', 'device.id')
    .join('Assay as assay', 'result.assayId', 'assay.id')
    .join('AssayType as assayType', 'assay.assayTypeId', 'assayType.id')
    .leftJoin('ResultCategory as resultCategory1', 'result.resultCategory1', 'resultCategory1.id')
    .leftJoin('ResultCategory as resultCategory2', 'result.resultCategory2', 'resultCategory2.id')
    .leftJoin('Site as reportableSite', 'result.reportableSiteId', 'reportableSite.id')
    .leftJoin('Geography as reportableSiteGeography', 'reportableSite.geographyId', 'reportableSiteGeography.id')
    .leftJoin('Sample as sample', 'result.sampleId', 'sample.id')
    .leftJoin('SampleType as sampleType', 'sample.sampleTypeId', 'sampleType.id')
    .leftJoin('Site as sampleOriginSite', 'sample.originSiteId', 'sampleOriginSite.id')
    .leftJoin('Geography as sampleOriginGeography', 'sampleOriginSite.geographyId', 'sampleOriginGeography.id')
    .leftJoin('State as sampleOriginState', 'sampleOriginGeography.stateId', 'sampleOriginState.id')
    .leftJoin('ResultWorkflowLog as resultWorkflowLog', 'result.resultWorkflowStatusLogId', 'resultWorkflowLog.id')
    .leftJoin(
      'ResultWorkflowStatus as resultWorkflowStatus',
      'resultWorkflowLog.resultWorkflowStatusId',
      'resultWorkflowStatus.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as resultTreatmentStatusLog',
      'result.treatmentStatusLogId',
      'resultTreatmentStatusLog.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as resultTreatmentStatus',
      'resultTreatmentStatusLog.resultTreatmentStatusId',
      'resultTreatmentStatus.id'
    )
    .leftJoin('ResultStatusLog as resultStatusLog', 'result.resultStatusLogId', 'resultStatusLog.id')
    .leftJoin('Person as personTransferred', 'resultStatusLog.createdBy', 'personTransferred.userId')
    .leftJoin('ResultCategoryAssay as resultCategoryAssay1', queryBuilder =>
      queryBuilder
        .on('result.assayId', 'resultCategoryAssay1.assayId')
        .andOn('result.resultCategory1', 'resultCategoryAssay1.resultCategoryId')
    )
    .leftJoin('ResultCategoryAssay as resultCategoryAssay2', queryBuilder =>
      queryBuilder
        .on('result.assayId', 'resultCategoryAssay2.assayId')
        .andOn('result.resultCategory2', 'resultCategoryAssay2.resultCategoryId')
    )
    .modify(addConstraints, dataConstraints, {
      assay: 'assay',
      assayType: 'assayType',
      site: 'reportableSite',
      geography: 'reportableSiteGeography',
      result: 'result',
    })
    .where('result.updatedOn', '>', minUpdatedOn)
    .andWhere(qb => qb.whereIn('resultWorkflowStatus.externalId', deliverableResultWorkflowStatuses))
    .andWhere(qb =>
      qb
        .where('sample.registeredInAspect', true)
        .orWhere('resultCategoryAssay1.requiresTreatment', true)
        .orWhere('resultCategoryAssay2.requiresTreatment', true)
    )
    .select(
      'assay.externalId as assayExternalId',
      'assay.patientDataSchema as patientDataSchema',
      'assay.resultCategory1Label as resultCategory1Label',
      'assay.resultCategory1i18nKey as resultCategory1i18nKey',
      'assay.resultCategory2Label as resultCategory2Label',
      'assay.resultCategory2i18nKey as resultCategory2i18nKey',
      'assayType.abbreviation as assayTypeAbbreviation',
      'assayType.i18nKey as assayTypeI18nKey',
      'personTransferred.name as transferredBy',
      'result.id as id',
      'result.patientData as patientData',
      'result.resultData as resultData',
      'result.sampleId as resultSampleId',
      'result.updatedOn as updatedOn',
      knex.raw('COALESCE(result.endedOn, result.startedOn) as testDate'),
      'resultCategory1.i18nKey as resultCategory1ValueI18nKey',
      'resultCategory1.name as resultCategory1Name',
      'resultCategory2.i18nKey as resultCategory2ValueI18nKey',
      'resultCategory2.name as resultCategory2Name',
      'resultCategoryAssay1.emphasize as resultCategory1Emphasize',
      'resultCategoryAssay1.requiresTreatment as resultCategoryAssay1RequiresTreatment',
      'resultCategoryAssay2.emphasize as resultCategory2Emphasize',
      'resultCategoryAssay2.requiresTreatment as resultCategoryAssay2RequiresTreatment',
      'resultStatusLog.createdOn as transferredOn',
      'resultStatusLog.data as transferStatusLogData',
      'resultTreatmentStatus.externalId as resultTreatmentStatusExternalId',
      'resultTreatmentStatus.i18nKey as resultTreatmentStatusI18nKey',
      'resultTreatmentStatus.name as resultTreatmentStatusName',
      'resultTreatmentStatusLog.changedOn as resultTreatmentStatusChangedOn',
      'resultWorkflowLog.changedOn as resultWorkflowStatusChangedOn',
      'resultWorkflowLog.resultWorkflowStatusId as resultWorkflowStatusId',
      'sample.externalId as sampleExternalId',
      'sample.id as sampleId',
      'sample.sampleStatus as sampleStatus',
      'sample.updatedOn as sampleUpdatedOn',
      'sample.collectedOn as sampleCollectedOn',
      'sampleOriginSite.externalId as sampleSiteExternalId',
      'sampleOriginSite.id as sampleSiteId',
      'sampleOriginSite.name as sampleSiteName',
      'sampleOriginState.name as sampleSiteStateName',
      'sampleType.externalId as sampleTypeExternalId',
      'sampleType.i18nKey as sampleTypeI18nKey',
      'sampleType.name as sampleTypeName',
      'reportableSite.id as reportableSiteId',
      'reportableSite.name as reportableSiteName',
      'resultWorkflowStatus.externalId as resultWorkflowStatusExternalId'
    )
  return knexQuery
}

const getAcknowledgementsByResultIds = results => {
  const knexQuery = knex('ResultWorkflowLog as rwl')
    .join('ResultWorkflowStatus as rws', 'rwl.resultWorkflowStatusId', 'rws.id')
    .whereIn(
      'rwl.resultId',
      _.map(results, r => r.id)
    )
    .andWhere('rws.externalId', 'Acknowledged')
    .select('rwl.resultId', knex.raw('MAX(rwl.changedOn) as acknowledgedOn'))
    .groupBy('rwl.resultId')
  return knexQuery
}

const getFollowUpsByResultIds = results => {
  const knexQuery = knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .whereIn(
      'rfu.resultId',
      _.map(results, r => r.id)
    )
    .where('rfu.isDeleted', false)
    .select(
      'rfu.resultId',
      'rfu.id',
      'rfu.externalId',
      'rfu.date',
      'rfu.createdOn',
      'rfu.updatedOn',
      'fu.name as followUpName',
      'fu.externalId as followUpExternalId',
      'fu.i18nKey as followUpi18nKey',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId',
      'fut.i18nKey as followUpTypeI18nKey'
    )
  return knexQuery
}

const getCommentsOfResultById = comments => {
  const knexQuery = knex('ResultNote as rn')
    .innerJoin('ResultNoteType as rnt', 'rn.resultNoteTypeId', 'rnt.id')
    .leftOuterJoin('User as createdByUser', 'rn.createdBy', 'createdByUser.id')
    .leftOuterJoin('Person as createdByPerson', 'createdByUser.id', 'createdByPerson.userId')
    .leftOuterJoin('User as updatedByUser', 'rn.updatedBy', 'updatedByUser.id')
    .leftOuterJoin('Person as updatedByPerson', 'updatedByUser.id', 'updatedByPerson.userId')
    .whereIn(
      'rn.resultId',
      _.map(comments, r => r.id)
    )
    .groupBy('rn.id')
    .select(
      'rn.resultId',
      'rn.id',
      'rn.text',
      'rn.createdOn',
      'createdByPerson.name as createdBy',
      'rn.changedOn',
      'updatedByPerson.name as changedBy',
      'rnt.name as noteType'
    )
  return knexQuery
}

const countAllAwaitingTreatment = (query, dataConstraints) => {
  const minUpdatedOn = query?.minUpdatedOn ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)
  const knexQuery = knex('Result as result')
    .join(
      'ResultTreatmentStatusLog as resultTreatmentStatusLog',
      'result.treatmentStatusLogId',
      'resultTreatmentStatusLog.id'
    )
    .join(
      'ResultTreatmentStatus as resultTreatmentStatus',
      'resultTreatmentStatusLog.resultTreatmentStatusId',
      'resultTreatmentStatus.id'
    )
    .leftJoin('Site as reportableSite', 'result.reportableSiteId', 'reportableSite.id')
    .leftJoin('Geography as reportableSiteGeography', 'reportableSite.geographyId', 'reportableSiteGeography.id')
    .leftJoin('ResultWorkflowLog as resultWorkflowLog', 'result.resultWorkflowStatusLogId', 'resultWorkflowLog.id')
    .leftJoin(
      'ResultWorkflowStatus as resultWorkflowStatus',
      'resultWorkflowLog.resultWorkflowStatusId',
      'resultWorkflowStatus.id'
    )
    .leftJoin('ResultCategoryAssay as resultCategoryAssay1', queryBuilder =>
      queryBuilder
        .on('result.assayId', 'resultCategoryAssay1.assayId')
        .andOn('result.resultCategory1', 'resultCategoryAssay1.resultCategoryId')
    )
    .leftJoin('ResultCategoryAssay as resultCategoryAssay2', queryBuilder =>
      queryBuilder
        .on('result.assayId', 'resultCategoryAssay2.assayId')
        .andOn('result.resultCategory2', 'resultCategoryAssay2.resultCategoryId')
    )
    .where('resultTreatmentStatus.externalId', 'AwaitingTreatment')
    .modify(addConstraints, dataConstraints, {
      site: 'reportableSite',
      geography: 'reportableSiteGeography',
      result: 'result',
    })
    .where('result.updatedOn', '>', minUpdatedOn)
    .andWhere(qb => qb.whereIn('resultWorkflowStatus.externalId', deliverableResultWorkflowStatuses))
    .andWhere(qb =>
      qb.orWhere('resultCategoryAssay1.requiresTreatment', true).orWhere('resultCategoryAssay2.requiresTreatment', true)
    )
    .countDistinct('result.id as count')
    .first()
  return knexQuery
}

module.exports = {
  countAllAwaitingTreatment,
  fetchResultsByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsByResultIds,
  getAcknowledgementsByResultIds,
}
