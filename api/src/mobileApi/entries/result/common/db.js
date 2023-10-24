const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const { knex } = require('../../../../db')
const {
  ACKNOWLEDGED,
  FLAGGED,
  MONTHS_HISTORY_TO_LOOK_UP,
  MOBILE_APP_ALLOWED_ASSAYS,
  deliverableResultWorkflowStatuses,
} = require('../../common/consts')
const { addConstraints } = require('../../../../auth/constraints')
const { INTERNAL_DEVICE_IDS } = require('../../../../shared/constants')

const fetchResultsByUpdatedOnQuery = (query, clinicIds, dataConstraints, userViewOnlyTransferredResultIds) => {
  const minUpdatedOn = query?.minUpdatedOn ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)

  const knexQuery = knex('Result as result')
    .join('Device as device', 'result.deviceId', 'device.id')
    .join('Site as laboratory', 'result.siteId', 'laboratory.id')
    .join('Assay as assay', 'result.assayId', 'assay.id')
    .join('AssayType as assayType', 'assay.assayTypeId', 'assayType.id')
    .join('Site as reportableSite', 'result.reportableSiteId', 'reportableSite.id')
    .leftJoin('Geography as reportableSiteGeography', 'reportableSite.geographyId', 'reportableSiteGeography.id')
    .leftJoin('ResultCategory as resultCategory1', 'result.resultCategory1', 'resultCategory1.id')
    .leftJoin('ResultCategory as resultCategory2', 'result.resultCategory2', 'resultCategory2.id')
    .leftJoin('Sample as sample', 'result.sampleId', 'sample.id')
    .leftJoin('SampleType as sampleType', 'sample.sampleTypeId', 'sampleType.id')
    .leftJoin('Person as sampleCollectedBy', 'sample.collectedBy', 'sampleCollectedBy.userId')
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
    .leftJoin('ResultStatusLog as resultStatusLog', 'result.id', 'resultStatusLog.resultId')
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
    .leftJoin('ResultTransferLog as transferLog', 'result.id', 'transferLog.resultId')
    .leftJoin('Site as transferReportableSite', 'transferLog.reportableSiteId', 'transferReportableSite.id')
    .leftJoin('Site as transferOriginSite', 'transferLog.previousReportableSiteId', 'transferOriginSite.id')
    .leftJoin('Site as transferSite', 'transferLog.siteId', 'transferSite.id')
    .leftJoin('Person as personTransferred', 'transferLog.createdBy', 'personTransferred.userId')
    .whereIn('result.reportableSiteId', clinicIds)
    .modify(addConstraints, dataConstraints, {
      assay: 'assay',
      assayType: 'assayType',
    })
    .andWhere('result.updatedOn', '>', minUpdatedOn)
    .andWhere(qb => qb.whereIn('resultWorkflowStatus.externalId', deliverableResultWorkflowStatuses))
    .andWhere(qb =>
      qb
        .where('sample.registeredInAspect', true)
        .orWhere('resultCategoryAssay1.requiresTreatment', true)
        .orWhere('resultCategoryAssay2.requiresTreatment', true)
    )
    .modify(qb => {
      if (!_.isEmpty(MOBILE_APP_ALLOWED_ASSAYS)) {
        qb.whereIn('assay.externalId', MOBILE_APP_ALLOWED_ASSAYS)
      }
    })
    .orWhereIn('result.id', userViewOnlyTransferredResultIds)
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
      'result.errorCode as errorCode',
      'result.endedOn as testEndDate',
      'result.notes as resultNotes',
      knex.raw('COALESCE(result.endedOn, result.startedOn) as testDate'),
      'resultCategory1.i18nKey as resultCategory1ValueI18nKey',
      'resultCategory1.name as resultCategory1Name',
      'resultCategory2.i18nKey as resultCategory2ValueI18nKey',
      'resultCategory2.name as resultCategory2Name',
      'resultCategoryAssay1.emphasize as resultCategory1Emphasize',
      'resultCategoryAssay1.requiresTreatment as resultCategoryAssay1RequiresTreatment',
      'resultCategoryAssay2.emphasize as resultCategory2Emphasize',
      'resultCategoryAssay2.requiresTreatment as resultCategoryAssay2RequiresTreatment',
      'resultStatusLog.data as transferStatusLogData',
      'resultTreatmentStatus.externalId as resultTreatmentStatusExternalId',
      'resultTreatmentStatus.i18nKey as resultTreatmentStatusI18nKey',
      'resultTreatmentStatus.name as resultTreatmentStatusName',
      'resultTreatmentStatusLog.changedOn as resultTreatmentStatusChangedOn',
      'resultWorkflowLog.changedOn as resultWorkflowStatusChangedOn',
      'resultWorkflowLog.resultWorkflowStatusId as resultWorkflowStatusId',
      'resultWorkflowLog.reason as resultWorkflowStatusReason',
      'sample.externalId as sampleExternalId',
      'sample.id as sampleId',
      'sample.sampleData',
      'sample.sampleStatus as sampleStatus',
      'sample.updatedOn as sampleUpdatedOn',
      'sample.collectedOn as sampleCollectedOn',
      'sample.externalId as sampleExternalId',
      'sampleOriginSite.externalId as sampleSiteExternalId',
      'sampleOriginSite.id as sampleSiteId',
      'sampleOriginSite.name as sampleSiteName',
      'sampleOriginState.name as sampleSiteStateName',
      'sampleType.externalId as sampleTypeExternalId',
      'sampleType.i18nKey as sampleTypeI18nKey',
      'sampleType.name as sampleTypeName',
      'reportableSite.id as reportableSiteId',
      'reportableSite.externalId as reportableSiteExternalId',
      'reportableSite.name as reportableSiteName',
      'laboratory.id as laboratorySiteId',
      'laboratory.externalId as laboratorySiteExternalId',
      'laboratory.name as laboratorySiteName',
      'resultWorkflowStatus.externalId as resultWorkflowStatusExternalId',
      'sampleCollectedBy.name as sampleClinicianName',
      'transferReportableSite.name as transferSiteName',
      'transferOriginSite.name as transferOriginSiteName',
      'transferLog.comment as transferComment',
      'transferLog.createdOn as transferredOn',
      'transferLog.reportableSiteId as transferReportableSiteId',
      'transferLog.previousReportableSiteId as transferPreviousReportableSiteId',
      'transferLog.siteId as transferSiteId'
    )
  return knexQuery
}

const getWorkflowLogsByResultIds = (results, resultWorkflowStatusExternalId) => {
  return knex('ResultWorkflowLog as rwl')
    .join('ResultWorkflowStatus as rws', 'rwl.resultWorkflowStatusId', 'rws.id')
    .whereIn(
      'rwl.resultId',
      _.map(results, r => r.id)
    )
    .andWhere('rws.externalId', resultWorkflowStatusExternalId)
}

const getAcknowledgementsByResultIds = results => {
  return getWorkflowLogsByResultIds(results, ACKNOWLEDGED)
    .select('rwl.resultId', knex.raw('MAX(rwl.changedOn) as acknowledgedOn'))
    .groupBy('rwl.resultId')
}

const getFlagsByResultIds = results => {
  return getWorkflowLogsByResultIds(results, FLAGGED)
    .whereNotNull('rwl.reason')
    .andWhere('rwl.reason', '<>', '')
    .distinct('rwl.resultId', 'rwl.changedOn as flaggedOn', 'rwl.reason')
}

const getFollowUpsByResultIds = results => {
  const knexQuery = knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .leftJoin('Person as p', 'p.userId', 'rfu.createdBy')
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
      'fut.i18nKey as followUpTypeI18nKey',
      'p.name as clinicianName'
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

const getUserSiteIds = async dataConstraints => {
  const sites = await knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)
    .groupBy(['s.id'])
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .select('s.id')
  return sites.map(s => s.id)
}

module.exports = {
  fetchResultsByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsByResultIds,
  getAcknowledgementsByResultIds,
  getFlagsByResultIds,
  getUserSiteIds,
}
