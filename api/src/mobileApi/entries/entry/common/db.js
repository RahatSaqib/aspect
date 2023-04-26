const subMonths = require('date-fns/subMonths')
const formatISO = require('date-fns/formatISO')
const { knex } = require('../../../../db')
// const { addConstraints } = require('../../../../auth/constraints')

const fetchEntriesByUpdatedOnQuery = query => {
  const minUpdatedOn = query?.minUpdatedOn ?? formatISO(subMonths(new Date(), 1))

  const latestUpdatedOn = knex.raw(
    `DATE_FORMAT(
        GREATEST(
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00'),
            COALESCE(??, '1000-01-01 00:00:00')
        ), '%Y-%m-%dT%H:%i:%s.%fZ'
    )`,
    [
      'result.updatedOn',
      'result_status_log.createdOn',
      'result_treatment_status_log.changedOn',
      'result_workflow_log.changedOn',
      'result_follow_up.date',
      'result_follow_up.createdOn',
      'result_follow_up.updatedOn',
    ]
  )

  const knexQuery = knex('Result as result')
    .select(
      'assay.patientDataSchema as patientDataSchema',
      'assay.resultCategory1Label as resultCategory1Label',
      'assay.resultCategory1i18nKey as resultCategory1i18nKey',
      'assay.resultCategory2Label as resultCategory2Label',
      'assay.resultCategory2i18nKey as resultCategory2i18nKey',
      'assay_type.abbreviation as assayTypeAbbreviation',
      'assay_type.i18nKey as assayTypeI18nKey',
      'person_transferred.name as transferredBy',
      'result.id as id',
      'result.patientData as patientData',
      'result.resultData as resultData',
      'result.sampleId as resultSampleId',
      'result.updatedOn as updatedOn',
      'result_category_1.i18nKey as resultCategory1ValueI18nKey',
      'result_category_1.name as resultCategory1Name',
      'result_category_2.name as resultCategory2Name',
      'result_category_assay.emphasize as resultCategory1Emphasize',
      'result_category_assay.requiresTreatment as resultRequiresTreatment',
      'result_category_assay2.emphasize as resultCategory2Emphasize',
      'result_status_log.createdOn as transferredOn',
      'result_status_log.data as transferStatusLogData',
      'result_treatment_status.externalId as resultTreatmentStatusExternalId',
      'result_treatment_status.i18nKey as resultTreatmentStatusI18nKey',
      'result_treatment_status.name as resultTreatmentStatusName',
      'result_treatment_status_log.changedOn as resultTreatmentStatusChangedOn',
      'result_workflow_log.changedOn as resultWorkflowStatusChangedOn',
      'result_workflow_log.resultWorkflowStatusId as resultWorkflowStatusId',
      'sample.externalId as sampleExternalId',
      'sample.id as sampleId',
      'sample.sampleStatus as sampleStatus',
      'sample.updatedOn as sampleUpdatedOn',
      'sample.collectedOn as sampleCollectedOn',
      'sample_site.externalId as sampleSiteExternalId',
      'sample_site.id as sampleSiteId',
      'sample_site.name as sampleSiteName',
      'sample_type.externalId as sampleTypeExternalId',
      'sample_type.i18nKey as sampleTypeI18nKey',
      'sample_type.name as sampleTypeName',
      'site_result.id as reportableSiteId',
      'result_follow_up.resultId as resultFollowUpResultId',
      'result_follow_up.date as resultFollowUpDate',
      'result_follow_up.createdOn as resultFollowUpCreatedOn',
      'result_follow_up.updatedOn as resultFollowUpUpdatedOn'
    )
    .innerJoin('Assay as assay', 'result.assayId', 'assay.id')
    .innerJoin('AssayType as assay_type', 'assay.assayTypeId', 'assay_type.id')
    .leftOuterJoin('ResultFollowUp as result_follow_up', 'result.id', 'result_follow_up.resultId')
    .leftJoin('ResultCategory as result_category_1', 'result.resultCategory1', 'result_category_1.id')
    .leftJoin('ResultCategory as result_category_2', 'result.resultCategory2', 'result_category_2.id')
    .leftJoin('Site as site_result', 'result.reportableSiteId', 'site_result.id')
    .leftJoin('Sample as sample', 'result.sampleId', 'sample.id')
    .leftJoin('SampleType as sample_type', 'sample.sampleTypeId', 'sample_type.id')
    .leftJoin('Site as sample_site', 'sample.originSiteId', 'sample_site.id')
    .leftJoin('ResultWorkflowLog as result_workflow_log', 'result.resultWorkflowStatusLogId', 'result_workflow_log.id')
    .leftJoin(
      'ResultWorkflowStatus as result_workflow_status',
      'result_workflow_log.resultWorkflowStatusId',
      'result_workflow_status.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as result_treatment_status_log',
      'result.treatmentStatusLogId',
      'result_treatment_status_log.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as result_treatment_status',
      'result_treatment_status_log.resultTreatmentStatusId',
      'result_treatment_status.id'
    )
    .leftJoin('ResultStatusLog as result_status_log', 'result.resultStatusLogId', 'result_status_log.id')
    .leftJoin('Person as person_transferred', 'result_status_log.createdBy', 'person_transferred.userId')
    .leftJoin('ResultCategoryAssay as result_category_assay', function () {
      this.on('result.assayId', 'result_category_assay.assayId').andOn(
        'result.resultCategory1',
        'result_category_assay.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as result_category_assay2', function () {
      this.on('result.assayId', 'result_category_assay2.assayId').andOn(
        'result.resultCategory2',
        'result_category_assay2.resultCategoryId'
      )
    })
    .having(latestUpdatedOn, '>', minUpdatedOn)
  return knexQuery
}

const getFollowUpsOfResultById = data => {
  const query = knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .whereIn(
      'rfu.resultId',
      data.map(r => r.id)
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
  return query
}

const getCommentsOfResultById = data => {
  return knex('ResultNote as rn')
    .innerJoin('ResultNoteType as rnt', 'rn.resultNoteTypeId', 'rnt.id')
    .leftOuterJoin('User as uC', 'rn.createdBy', 'uC.id')
    .leftOuterJoin('User as uU', 'rn.updatedBy', 'uU.id')
    .whereIn(
      'rn.resultId',
      data.map(r => r.id)
    )
    .select(
      'rn.resultId',
      'rn.id',
      'rn.text',
      'rn.createdOn',
      'uC.name as createdBy',
      'rn.changedOn',
      'uU.name as changedBy',
      'rnt.name as noteType'
    )
}

const countAllAwaitingTreatment = () =>
  knex('Result as result')
    .countDistinct('result.id as count')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'result.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .where('rts.id', 1)
    .first()

module.exports = {
  countAllAwaitingTreatment,
  fetchEntriesByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsOfResultById,
}
