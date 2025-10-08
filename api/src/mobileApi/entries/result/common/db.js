const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const { knex } = require('../../../../db')
const { ACKNOWLEDGED, FLAGGED, MONTHS_HISTORY_TO_LOOK_UP } = require('../../common/consts')
const { addConstraints } = require('../../../../auth/constraints')
const { INTERNAL_DEVICE_IDS } = require('../../../../shared/constants')
const { allResultCategoryToId } = require('../../../../shared/dictionary')
const { buildQueryForResultsListAndExport } = require('../../../../result/service')

const fetchResultsBySubmittedSinceQuery = async (query, dataConstraints) => {
  const modifiedSince = query?.minUpdatedOn ?? query?.modifiedSince
  const submittedSince = query?.submittedSince ?? subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP)

  const resultCategoryToId = await allResultCategoryToId()

  const queryBuilder = fetchResultsQuery(
    {
      ...query,
      modifiedSince,
      submittedSince,
      ignoredResultCategories: [resultCategoryToId.Invalid, resultCategoryToId.Error, resultCategoryToId.NoResult],
    },
    dataConstraints
  )
    .select(
      'a.externalId as assayExternalId',
      'a.patientDataSchema as patientDataSchema',
      'a.resultCategory1Label as resultCategory1Label',
      'a.resultCategory1i18nKey as resultCategory1i18nKey',
      'a.resultCategory2Label as resultCategory2Label',
      'a.resultCategory2i18nKey as resultCategory2i18nKey',
      'at.abbreviation as assayTypeAbbreviation',
      'at.i18nKey as assayTypeI18nKey',
      'personTransferred.name as transferredBy',
      'r.id as id',
      'r.patientData as patientData',
      'r.resultData as resultData',
      'r.sampleId as resultSampleId',
      'r.updatedOn as updatedOn',
      'r.errorCode as errorCode',
      'r.endedOn as testEndDate',
      'r.notes as resultNotes',
      knex.raw('COALESCE(r.endedOn, r.startedOn) as testDate'),
      'rc1.i18nKey as resultCategory1ValueI18nKey',
      'rc1.name as resultCategory1Name',
      'rc2.i18nKey as resultCategory2ValueI18nKey',
      'rc2.name as resultCategory2Name',
      'rca.emphasize as resultCategory1Emphasize',
      'rca.requiresTreatment as resultCategoryAssay1RequiresTreatment',
      'rca2.emphasize as resultCategory2Emphasize',
      'rca2.requiresTreatment as resultCategoryAssay2RequiresTreatment',
      'resultStatusLog.data as transferStatusLogData',
      'resultTreatmentStatus.externalId as resultTreatmentStatusExternalId',
      'resultTreatmentStatus.i18nKey as resultTreatmentStatusI18nKey',
      'resultTreatmentStatus.name as resultTreatmentStatusName',
      'resultTreatmentStatusLog.changedOn as resultTreatmentStatusChangedOn',
      'resultWorkflowLog.changedOn as resultWorkflowStatusChangedOn',
      'resultWorkflowLog.resultWorkflowStatusId as resultWorkflowStatusId',
      'resultWorkflowLog.reason as resultWorkflowStatusReason',
      'sp.id as sampleId',
      'sp.sampleData',
      'sp.sampleStatus as sampleStatus',
      'sp.updatedOn as sampleUpdatedOn',
      'sp.collectedOn as sampleCollectedOn',
      'sp.externalId as sampleExternalId',
      'sampleOriginSite.externalId as sampleSiteExternalId',
      'sampleOriginSite.id as sampleSiteId',
      'sampleOriginSite.name as sampleSiteName',
      'sampleOriginState.name as sampleSiteStateName',
      'stp.externalId as sampleTypeExternalId',
      'stp.i18nKey as sampleTypeI18nKey',
      'stp.name as sampleTypeName',
      'reportableSite.id as reportableSiteId',
      'reportableSite.externalId as reportableSiteExternalId',
      'reportableSite.name as reportableSiteName',
      'si.id as laboratorySiteId',
      'si.externalId as laboratorySiteExternalId',
      'si.name as laboratorySiteName',
      'resultWorkflowStatus.externalId as resultWorkflowStatusExternalId',
      'sampleCollectedBy.name as sampleClinicianName',
      'transferReportableSite.name as transferSiteName',
      'transferOriginSite.name as transferOriginSiteName',
      'transferLog.comment as transferComment',
      'transferLog.createdOn as transferredOn',
      'transferLog.reportableSiteId as transferReportableSiteId',
      'transferLog.previousReportableSiteId as transferPreviousReportableSiteId'
    )
    .orderBy('sampleCollectedOn', 'desc')
    .orderBy('testEndDate', 'desc')
  return queryBuilder
}

const fetchResultsQuery = (query, dataConstraints) => {
  const { modifiedSince, submittedSince, resultId, ignoredResultCategories } = query

  return buildQueryForResultsListAndExport(query, dataConstraints)
    .leftJoin('Person as sampleCollectedBy', 'sp.collectedBy', 'sampleCollectedBy.userId')
    .leftJoin('Site as sampleOriginSite', 'sp.originSiteId', 'sampleOriginSite.id')
    .leftJoin('Geography as sampleOriginGeography', 'sampleOriginSite.geographyId', 'sampleOriginGeography.id')
    .leftJoin('State as sampleOriginState', 'sampleOriginGeography.stateId', 'sampleOriginState.id')
    .leftJoin('ResultWorkflowLog as resultWorkflowLog', 'r.resultWorkflowStatusLogId', 'resultWorkflowLog.id')
    .leftJoin(
      'ResultWorkflowStatus as resultWorkflowStatus',
      'resultWorkflowLog.resultWorkflowStatusId',
      'resultWorkflowStatus.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as resultTreatmentStatusLog',
      'r.treatmentStatusLogId',
      'resultTreatmentStatusLog.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as resultTreatmentStatus',
      'resultTreatmentStatusLog.resultTreatmentStatusId',
      'resultTreatmentStatus.id'
    )
    .leftJoin('ResultStatusLog as resultStatusLog', 'r.id', 'resultStatusLog.resultId')
    .leftJoin('ResultTransferLog as transferLog', 'r.id', 'transferLog.resultId')
    .leftJoin('Site as transferReportableSite', 'transferLog.reportableSiteId', 'transferReportableSite.id')
    .leftJoin('Site as reportableSite', 'r.reportableSiteId', 'reportableSite.id')
    .leftJoin('Site as transferOriginSite', 'transferLog.previousReportableSiteId', 'transferOriginSite.id')
    .leftJoin('Person as personTransferred', 'transferLog.createdBy', 'personTransferred.userId')
    .andWhere(qb => {
      if (modifiedSince) {
        qb.where('r.updatedOn', '>=', modifiedSince).orWhereNull('r.updatedOn')
      }
    })
    .andWhere(qb => {
      if (submittedSince) {
        qb.where('r.endedOn', '>=', submittedSince).orWhere('sp.collectedOn', '>=', submittedSince)
      }
    })
    .whereNotIn('r.resultCategory1', ignoredResultCategories)
    .andWhere(qb => {
      if (resultId) {
        qb.where('r.id', resultId)
      }
    })
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
  fetchResultsBySubmittedSinceQuery,
  fetchResultsQuery,
  getFollowUpsByResultIds,
  getAcknowledgementsByResultIds,
  getFlagsByResultIds,
  getUserSiteIds,
}
