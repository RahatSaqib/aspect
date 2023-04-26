const { knex, sortPageParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

const generateResultQuery = (query, dataConstraints, resultId) => {
  const knexQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
    .leftJoin('ResultWorkflowStatus as rs', 'rsl.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('ResultStatusLog as rslog', 'r.resultStatusLogId', 'rslog.id')
    .leftJoin('Person as ptr', 'rslog.createdBy', 'ptr.userId')
    .leftJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    // only results which are reportable for either ResultCategory
    .where(builder => builder.where('rca.reportable', 1).orWhere('rca2.reportable', 1))
    .whereIn('rs.externalId', ['Deliverable', 'Delivered', 'Acknowledged', 'Flagged'])
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      deviceType: 'dt',
      sample: 'sp',
      geography: 'g',
      result: 'r',
      country: 'c',
    })
  if (query) {
    knexQuery.modify((queryBuilder, params) => {
      if (params.minUpdatedOn) {
        queryBuilder.where('r.updatedOn', '>=', params.minUpdatedOn)
      }
      if (params.maxUpdatedOn) {
        queryBuilder.where('r.updatedOn', '<', params.maxUpdatedOn)
      }
      if (params.patientSample) {
        queryBuilder.where(builder =>
          builder
            .where('sp.externalId', 'like', `%${params.patientSample}%`)
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.firstName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%'`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.lastName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.name")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.id")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
        )
      }
      if (params.assayExternalIds) {
        queryBuilder.whereIn('a.externalId', params.assayExternalIds.split(','))
      }
      if (params.diseaseExternalIds) queryBuilder.whereIn('dis.externalId', params.diseaseExternalIds.split(','))

      if (params.resultCategories) {
        queryBuilder.where(builder =>
          builder
            .whereIn('rc1.externalId', params.resultCategories.split(','))
            .orWhereIn('rc2.externalId', params.resultCategories.split(','))
        )
      }
      if (params.workflowStatus) {
        queryBuilder.where('rs.externalId', params.workflowStatus)
      }
      if (params.isTransferred) {
        // return only results transferred "to me" (to r.reportableSiteId)
        queryBuilder.whereRaw('sp.originSiteId != r.reportableSiteId')
      }
      if (params.treatmentStatus) queryBuilder.where('rts.externalId', params.treatmentStatus)
      if (params.deviceType) queryBuilder.where('dt.externalId', params.deviceType)
    }, query)
  }
  if (resultId) {
    knexQuery.where({ 'r.id': resultId })
  }
  return knexQuery
}

// get total count for paging
const getCount = resultQuery => {
  return resultQuery.clone().countDistinct('r.id as count').first()
}

// get rows
const getItems = (resultQuery, query) => {
  return resultQuery
    .clone()
    .groupBy('r.id')
    .modify(sortPageParams, query, 'r.updatedOn')
    .select(
      'r.id',
      'r.externalId',
      'r.firstViewedOn',
      'r.endedOn',
      'r.updatedOn',
      'a.externalId as assayExternalId',
      'si.name as siteName',
      'd.name as deviceName',
      'rc1.externalId as resultCategory1ExternalId',
      'rc2.externalId as resultCategory2ExternalId',
      'r.patientData',
      'r.resultData',
      'dis.externalid as diseaseExternalId',
      'dis.name as diseaseName',
      'sp.externalId as sampleId',
      'so.id as sampleOriginSiteId',
      'so.externalId as sampleOriginSiteExternalId',
      'so.name as sampleOriginSiteName',
      'rs.name as resultWorkflowStatusName',
      'rs.externalId as resultWorkflowStatusExternalId',
      'rs.i18nKey as resultWorkflowStatusi18nKey',
      'rsl.reason as resultWorkflowStatusReason',
      'rsl.changedOn as resultWorkflowStatusChangedOn',
      'rtsl.changedOn as resultTreatmentStatusChangedOn',
      'rts.name as resultTreatmentStatusName',
      'rts.externalId as resultTreatmentStatusExternalId',
      'rts.i18nKey as resultTreatmentStatusi18nKey',
      'r.reportableSiteId',
      'sirep.name as reportableSiteName',
      'rslog.createdOn as transferredOn',
      'ptr.name as transferredBy'
    )
}

// get follow ups for all results in the response for performance (filter later)
const getFollowUps = data => {
  return knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .whereIn(
      'rfu.resultId',
      data.map(r => r.id)
    )
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
}

// get comments for all results in the response for performance (filter later)
const getComments = data => {
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

const insertResultWorkflowLogQuery = (resultId, resultWorkflowStatusId, now, userId) => {
  return knex('ResultWorkflowLog').insert({
    resultId,
    resultWorkflowStatusId,
    changedOn: now,
    createdOn: now,
    createdBy: userId,
    reason: 'Download Results Api',
    operator: 'Reporter App',
  })
}

const updateResultWorkflowLogQuery = (resultId, resultWorkflowStatusLogId) => {
  return knex('Result')
    .where({
      id: resultId,
    })
    .update({ resultWorkflowStatusLogId })
}

const getResultWorkflowStatusQuery = resultWorkflowStatusExternalId => {
  return knex('ResultWorkflowStatus').where('externalId', resultWorkflowStatusExternalId).first('id')
}

const addResultDownloadLogQuery = (resultId, now, userId) => {
  return knex('ResultDownloadLog').insert({
    resultId,
    createdOn: now,
    createdBy: userId,
  })
}

const generateResultQueryV2 = (query, dataConstraints, resultId) => {
  const knexQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
    .leftJoin('ResultWorkflowStatus as rs', 'rsl.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('ResultStatusLog as rslog', 'r.resultStatusLogId', 'rslog.id')
    .leftJoin('Person as ptr', 'rslog.createdBy', 'ptr.userId')
    .leftJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    // only results which are reportable for either ResultCategory
    .where(builder => builder.where('rca.reportable', 1).orWhere('rca2.reportable', 1))
    .whereIn('rs.externalId', ['Deliverable', 'Delivered', 'Acknowledged', 'Flagged'])

    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      deviceType: 'dt',
      sample: 'sp',
      geography: 'g',
      result: 'r',
      country: 'c',
    })
  if (query) {
    knexQuery.modify((queryBuilder, params) => {
      if (params.minUpdatedOn) {
        queryBuilder.where('r.updatedOn', '>=', params.minUpdatedOn)
      }
      if (params.maxUpdatedOn) {
        queryBuilder.where('r.updatedOn', '<', params.maxUpdatedOn)
      }
      if (params.patientSample) {
        queryBuilder.where(builder =>
          builder
            .where('sp.externalId', 'like', `%${params.patientSample}%`)
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.firstName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%'`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.lastName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.name")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.id")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
        )
      }
      if (params.assayExternalIds) {
        queryBuilder.whereIn('a.externalId', params.assayExternalIds.split(','))
      }
      if (params.diseaseExternalIds) queryBuilder.whereIn('dis.externalId', params.diseaseExternalIds.split(','))

      if (params.resultCategories) {
        queryBuilder.where(builder =>
          builder
            .whereIn('rc1.externalId', params.resultCategories.split(','))
            .orWhereIn('rc2.externalId', params.resultCategories.split(','))
        )
      }
      if (params.workflowStatus) {
        queryBuilder.where('rs.externalId', params.workflowStatus)
      }
      if (params.isTransferred) {
        // return only results transferred "to me" (to r.reportableSiteId)
        queryBuilder.whereRaw('sp.originSiteId != r.reportableSiteId')
      }
      if (params.treatmentStatus) queryBuilder.where('rts.externalId', params.treatmentStatus)
      if (params.deviceType) queryBuilder.where('dt.externalId', params.deviceType)
    }, query)
  }
  if (resultId) {
    knexQuery.where({ 'r.id': resultId })
  }
  return knexQuery
}

// get total count for paging v2
const getCountV2 = resultQuery => resultQuery.clone().countDistinct('r.id as count').first()

// get total awaiting treatment count v2
const getAwaitingTreatment = resultQuery =>
  resultQuery.clone().countDistinct('r.id as count').where('rts.id', 1).first()

// get rows v2
const getItemsV2 = (resultQuery, query) => {
  return resultQuery
    .clone()
    .groupBy('r.id')
    .modify(sortPageParams, query, 'r.updatedOn')
    .select(
      'r.id',
      'r.externalId',
      'r.firstViewedOn',
      'r.endedOn',
      'r.updatedOn',
      'a.externalId as assayExternalId',
      'at.i18nKey as contentI18nKey',
      'at.abbreviation as contentText',
      'si.name as siteName',
      'd.name as deviceName',
      'rc1.externalId as resultCategory1ExternalId',
      'rc2.externalId as resultCategory2ExternalId',
      'r.patientData',
      'a.patientDataSchema',
      'r.resultData',
      'dis.externalid as diseaseExternalId',
      'dis.name as diseaseName',
      'sp.externalId as sampleId',
      'sp.collectedOn as sampleCollectionOn',
      'so.id as sampleOriginSiteId',
      'so.externalId as sampleOriginSiteExternalId',
      'so.name as sampleOriginSiteName',
      'rs.name as resultWorkflowStatusName',
      'rs.externalId as resultWorkflowStatusExternalId',
      'rs.i18nKey as resultWorkflowStatusi18nKey',
      'rsl.reason as resultWorkflowStatusReason',
      'rsl.changedOn as resultWorkflowStatusChangedOn',
      'rsl.resultWorkflowStatusId',
      'rtsl.changedOn as resultTreatmentStatusChangedOn',
      'rts.name as resultTreatmentStatusName',
      'rts.externalId as resultTreatmentStatusExternalId',
      'rts.i18nKey as resultTreatmentStatusi18nKey',
      'r.reportableSiteId',
      'sirep.name as reportableSiteName',
      'rslog.createdOn as transferredOn',
      'ptr.name as transferredBy',
      'rca.requiresTreatment as requiresTreatment',
      'rca.reportable as reportable',
      'r.id as resultId',
      'a.resultCategory1Label',
      'a.resultCategory1I18nKey',
      'rc1.name as resultCategory1Name',
      'rc1.i18nKey as resultCategory1i18nKey',
      'rca.emphasize as resultCategory1Emphasize',
      'a.resultCategory2Label',
      'a.resultCategory2I18nKey',
      'rc2.name as resultCategory2Name',
      'rc2.i18nKey as resultCategory2i18nKey',
      'rca2.emphasize as resultCategory2Emphasize',
      'r.resultCategory1',
      'r.resultCategory2',
      knex.raw('r.resultData->>"$.copies" as copies')
    )
}

// get follow ups for all results in the response for performance (filter later) v2
const getFollowUpsV2 = data => {
  return knex('ResultFollowUp as rfu')
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
}

// get comments for all results in the response for performance (filter later) v2
const getCommentsV2 = data => {
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

// get follow ups for all results in the response for performance (filter later) v2
const getFollowUpsOfResultById = data => {
  return knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where({ 'rfu.resultId': data.id })
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
}
// get comments for all results in the response for performance (filter later) v2
const getCommentsOfResultById = data => {
  return knex('ResultNote as rn')
    .innerJoin('ResultNoteType as rnt', 'rn.resultNoteTypeId', 'rnt.id')
    .leftOuterJoin('User as uC', 'rn.createdBy', 'uC.id')
    .leftOuterJoin('User as uU', 'rn.updatedBy', 'uU.id')
    .where({ 'rn.resultId': data.id })
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

const getFollowUpsForResultFollowup = followUpExternalId => {
  return knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')
}

const getResultFollowUps = resultId => {
  return knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', resultId)
    .select('f.externalId', 't.externalId as followUpTypeExternalId')
}

const deleteResultFollowUp = (resultId, type, date) => {
  return knex('ResultFollowUp')
    .join('FollowUp as f', 'ResultFollowUp.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', resultId)
    .andWhere('t.externalId', type)
    .andWhere('ResultFollowUp.updatedOn', '<', date)
    .update({
      isDeleted: 1,
    })
}

const updateFollowUpDate = (date, resultId, externalId, currentUserId, followUp, clientDate) => {
  const query = knex('ResultFollowUp')
    .where('followUpId', followUp.id || '-1')
    .where('resultId', resultId)
    .where('externalId', externalId || '-1')
    .where('updatedOn', '<', clientDate)
    .update({
      date,
      updatedOn: new Date(),
      updatedBy: currentUserId,
      followUpId: knex.raw('ifnull(?, followUpId)', followUp ? followUp.id : null),
    })
  return query
}

// feature: clinical response
const getLastTreatmentStatusByResult = resultId => {
  return knex('Result as r')
    .innerJoin('ResultTreatmentStatusLog as rtl', 'r.treatmentStatusLogId', 'rtl.id')
    .innerJoin('ResultTreatmentStatus as ts', 'rtl.resultTreatmentStatusId', 'ts.id')
    .where('rtl.resultId', resultId)
    .orderBy('rtl.changedOn', 'desc')
    .first('rtl.changedOn', 'ts.name', 'ts.externalId', 'ts.i18nKey')
}

// feature: clinical response
const getTreatmentStatus = resultTreatmentStatusId => {
  return knex('ResultTreatmentStatus').where('id', resultTreatmentStatusId).first()
}

// feature: clinical response
const setTreatmentStatusLog = (resultId, treatmentStatusId, method, data, changedOn, userId) => {
  return knex('ResultTreatmentStatusLog').insert({
    resultId,
    resultTreatmentStatusId: treatmentStatusId,
    method,
    data,
    createdOn: new Date(),
    changedOn,
    createdBy: userId,
  })
}

// feature: clinical response
const addResultFollowUp = (resultId, externalId, followUpId, date, createdBy, updatedBy) => {
  return knex('ResultFollowUp').insert({
    resultId,
    externalId,
    followUpId,
    date,
    createdBy,
    createdOn: new Date(),
    updatedBy,
    updatedOn: date,
  })
}

// feature: clinical response
const updateResult = (resultId, treatmentStatusLogId, userId) => {
  return knex('Result').where('id', resultId).update({
    treatmentStatusLogId,
    updatedBy: userId,
    updatedOn: new Date(),
  })
}

// feature: clinical response
const getTreatmentStatusLogId = resultId => {
  return knex('Result').where('id', resultId).select('treatmentStatusLogId')
}

// feature: clinical response
const insertResultWorkflowLog = resultWorkflowLogEntry => {
  return knex('ResultWorkflowLog').insert(resultWorkflowLogEntry)
}

// feature: clinical response
const updateResultWithResultWorkflowLog = (resultWorkflowLogEntry, lastLogId, now) => {
  return knex('Result').where('id', resultWorkflowLogEntry.resultId).update({
    resultWorkflowStatusLogId: lastLogId,
    updatedBy: resultWorkflowLogEntry.createdBy,
    updatedOn: now,
  })
}

// feature: clinical response
const updateResultTreatmentStatusLog = (treatmentStatusLogId, data, changedOn) => {
  return knex('ResultTreatmentStatusLog').where('id', treatmentStatusLogId).update({
    data,
    changedOn,
  })
}

// feature: clinical response
const getLatestResultWorkflowLog = resultId => {
  return knex('ResultWorkflowLog')
    .where('resultId', resultId)
    .orderBy('createdOn', 'desc')
    .first('resultWorkflowStatusId', 'changedOn as resultWorkflowChangedOn')
}

module.exports = {
  addResultDownloadLogQuery,
  addResultFollowUp,
  deleteResultFollowUp,
  generateResultQuery,
  generateResultQueryV2,
  getAwaitingTreatment,
  getComments,
  getCommentsOfResultById,
  getCommentsV2,
  getCount,
  getCountV2,
  getFollowUps,
  getFollowUpsForResultFollowup,
  getFollowUpsOfResultById,
  getFollowUpsV2,
  getItems,
  getItemsV2,
  getLastTreatmentStatusByResult,
  getLatestResultWorkflowLog,
  getResultFollowUps,
  getResultWorkflowStatusQuery,
  getTreatmentStatus,
  getTreatmentStatusLogId,
  insertResultWorkflowLog,
  insertResultWorkflowLogQuery,
  setTreatmentStatusLog,
  updateFollowUpDate,
  updateResult,
  updateResultTreatmentStatusLog,
  updateResultWithResultWorkflowLog,
  updateResultWorkflowLogQuery,
}
