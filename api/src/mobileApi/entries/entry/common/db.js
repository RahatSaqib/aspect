const { knex } = require('../../../../db')
// const subMonths = require('date-fns/subMonths')
// const formatISO = require('date-fns/formatISO')
// const { addConstraints } = require('../../../../auth/constraints')

const fetchEntriesByUpdatedOnQuery = () => {
  const knexQuery = knex('Result as result')
    .select(
      'result.id as id',
      'assay.patientDataSchema as patientDataSchema',
      'assay.resultCategory1Label as resultCategory1Label',
      'assay.resultCategory1i18nKey as resultCategory1i18nKey',
      'assay.resultCategory2Label as resultCategory2Label',
      'assay.resultCategory2i18nKey as resultCategory2i18nKey',
      'assay_type.i18nKey as assayTypeI18nKey',
      'assay_type.abbreviation as assayTypeAbbreviation',
      'result.patientData as patientData',
      'result.resultData as resultData',
      'result.updatedOn as updatedOn',
      'result_category_1.i18nKey as resultCategory1ValueI18nKey',
      'result_category_1.name as resultCategory1Name',
      'result_category_2.name as resultCategory2Name',
      'result_category_assay.requiresTreatment as resultRequiresTreatment',
      'result_category_assay.emphasize as resultCategory1Emphasize',
      'result_category_assay2.emphasize as resultCategory2Emphasize',
      'sample.collectedOn as sampleCollectedOn',
      'sample.externalId as sampleExternalId',
      'sample.id as sampleId',
      'sample.originSiteId as sampleOriginSiteId',
      'sample_type.externalId as sampleType',
      'site_result.id as reportableSiteId',
      'site_sample.name as sampleOriginSiteName',
      'result_treatment_status.name as resultTreatmentStatusName',
      'result_treatment_status.i18nKey as resultTreatmentStatusI18nKey',
      'result_treatment_status.externalId as resultTreatmentStatusExternalId',
      'result_treatment_status_log.changedOn as resultTreatmentStatusChangedOn',
      'result_status_log.data as transferStatusLogData',
      'result_status_log.createdOn as transferredOn',
      'person_transferred.name as transferredBy',
      'result_workflow_log.resultWorkflowStatusId as resultWorkflowStatusId',
      'result_workflow_log.changedOn as resultWorkflowStatusChangedOn'
    )
    .innerJoin('Assay as assay', 'result.assayId', 'assay.id')
    .innerJoin('AssayType as assay_type', 'assay.assayTypeId', 'assay_type.id')
    .innerJoin('Sample as sample', 'result.sampleId', 'sample.id')
    .innerJoin('SampleType as sample_type', 'sample.sampleTypeId', 'sample_type.id')
    .leftJoin('ResultCategory as result_category_1', 'result.resultCategory1', 'result_category_1.id')
    .leftJoin('ResultCategory as result_category_2', 'result.resultCategory2', 'result_category_2.id')
    .leftJoin('Site as site_result', 'result.reportableSiteId', 'site_result.id')
    .leftJoin('Site as site_sample', 'sample.originSiteId', 'site_sample.id')
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
    .where('result.id', '=', 351)
  // .where('result.updatedOn', '>=', query?.minUpdatedOn ?? formatISO(subMonths(new Date(), 1)))
  // .where('result.id', '=', 451)
  // .where('result.id', '=', 281)
  // .where('result.id', '=', 292)
  // .where('result.id', '=', 283)
  // .limit(10)
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
      'fut.i18nKey as followUpTypei18nKey'
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
