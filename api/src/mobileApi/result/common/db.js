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
      'fut.i18nKey as followUpTypei18nKey'
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

const addResultDownlodLogQuery = (resultId, now, userId) => {
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
  resultQuery.clone().countDistinct('r.id as count').whereNot('rc1.externalId', 'NotDetected').first()

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
      'ptr.name as transferredBy',
      'rca.requiresTreatment as requiresTreatment',
      'rca.reportable as reportable'
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

const getFollowUpsForResultFollowup = (followUpExternalId, followUpId) => {
  return knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .orWhere('fu.id', followUpId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')
}

const getResultFollowUps = result => {
  return knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', result.data.id)
    .select('f.externalId', 't.externalId as followUpTypeExternalId')
}

const getLatestResultFollowUps = id => {
  return knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .join(
      knex('ResultFollowUp as sr')
        .join('FollowUp as sf', 'sr.followUpId', 'sf.id')
        .join('FollowUpType as st', 'sf.followUpTypeId', 'st.id')
        .select('st.externalId')
        .where('resultId', id)
        .max('sr.createdOn as max_date')
        .as('a')
        .groupBy('st.externalId')
    )
    .where('resultId', id)
    .select(
      'f.externalId',
      't.externalId as followUpTypeExternalId',
      'f.id',
      'r.updatedOn',
      'r.createdOn',
      'r.date',
      'r.resultId'
    )
    .groupBy('t.externalId')
}

const deleteResultFollowUp = (result, type, date) => {
  return knex('ResultFollowUp')
    .join('FollowUp as f', 'ResultFollowUp.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', result.data.id)
    .andWhere('t.externalId', type)
    .andWhere('ResultFollowUp.updatedOn', '<', date)
    .del()
}

const getResultFollowUpsbyResultIdExternalId = (resultId, externalId) => {
  return knex('ResultFollowUp').where('resultId', resultId).where('externalId', externalId).first('id')
}

const getAffectedRowsbyResultFollowUp = (date, resultId, externalId, currentUserId, followUp, id, clientDate) => {
  return knex('ResultFollowUp')
    .where('id', id || '-1')
    .andWhere('updatedOn', '<', clientDate)
    .orWhere(function () {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .update({
      date,
      updatedOn: new Date(),
      updatedBy: currentUserId,
      followUpId: knex.raw('ifnull(?, followUpId)', followUp ? followUp.id : null),
    })
}

function getBaseQueryForResults() {
  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('ResultSource as rso', 'r.resultSourceId', 'rso.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin('PartnerAssay as pa', function () {
      this.on('r.assayId', 'pa.assayId').andOn('r.partnerId', 'pa.partnerId')
    })
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
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
    .leftJoin('PatientCase as ca', 'ca.id', 'r.patientCaseId')

  return resultQuery
}

// feature: clinical response
const generateResultQueryForResultFollowUp = async (resultId, dataConstraints, fields) => {
  const resultQuery = await getBaseQueryForResults()
    .leftJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    .leftJoin('ResultForm as rf', function () {
      this.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .where('r.id', resultId)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
    })
    .modify(function (qb) {
      qb.select(fields)
    })
    .select({
      resultText: knex.raw(
        `CONCAT(a.resultCategory1label,':',IFNULL(rc1.name, ''), '|', a.resultCategory2label ,':',IFNULL(rc2.name, '-'))`
      ),
      stateId: 'st.id',
      deviceTypeId: 'dt.id',
      resultCategory1: 'r.resultCategory1',
      resultCategory2: 'r.resultCategory2',
      sampleTypeId: 'stp.id',
      resultSourceExternalId: 'rso.externalId',
      partnerId: 'p.id',
      partnerPluginName: 'p.plugin',
      deviceTypePluginName: 'dt.plugin',
    })
  return resultQuery
}

// feature: clinical response
const getAssayForResultFollowup = data => {
  return knex('Assay as a')
    .join('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
    .where('a.id', data.assayId)
    .first('a.*', 'dt.externalId as deviceTypeExternalId')
}

// feature: clinical response
const getFileReferencesForResultFolloup = (resultId, dataConstraints) => {
  return knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where('rf.resultId', resultId)
    .orderBy('f.id', 'asc')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
      sample: 'sp',
    })
    .select(
      'f.id',
      'f.name',
      'f.length',
      'f.createdOn',
      'fct.externalId as fileContentType',
      'fct.mimeType',
      'fct.mimeSubtype'
    )
}

// feature: clinical response
const showResultFolloup = (resultId, dataConstraints) => {
  return knex('ResultFollowUp as rfu')
    .join('Result as r', 'r.id', 'rfu.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('rfu.resultId', resultId)
    .orderBy('rfu.date', 'rfu.updatedOn')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
      sample: 'sp',
    })
    .select(
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
}

// feature: clinical response
const getResultNotesByResultIdForResultFollowup = resultId => {
  return knex('ResultNote as rn')
    .leftJoin('User as u', 'rn.createdBy', 'u.id')
    .leftJoin('ResultNoteType as rt', 'rt.id', 'rn.resultNoteTypeId')
    .where('rn.resultId', resultId)
    .orderBy('rn.createdOn', 'desc')
    .select('u.name as createdBy', 'rn.text', 'rn.id', 'rn.changedOn', 'rn.createdOn', 'rt.name as noteType')
}

// feature: clinical response
const COMMON_LIST_FIELDS_UTC = {
  id: 'r.id',
  externalId: 'r.externalId',
  deviceId: 'r.deviceId',
  deviceName: 'd.name',
  deviceSerial: 'd.serial',
  deviceType: knex.raw("CONCAT(dt.manufacturer, ' ', dt.name)"),
  assayType: 'at.name',
  countryName: 'c.name',
  stateName: 'st.name',
  lgaName: 'lg.name',
  resultCategory1Name: 'rc1.name',
  resultCategory2Name: 'rc2.name',
  resultWorkflowStatusId: 'rs.id',
  resultWorkflowStatus: 'rs.name',
  resultWorkflowStatusExternalId: 'rs.externalId',
  resultTreatmentStatus: 'rts.externalId',
  resultData: 'r.resultData',
  formData: 'r.formData',
  siteId: 'r.siteId',
  siteName: 'si.name',
  assayVersion: 'r.assayVersion',
  consumableSerial: 'r.consumableSerial',
  consumableLot: 'r.consumableLot',
  instrumentSerial: 'r.instrumentSerial',
  moduleName: 'r.moduleName',
  moduleSerial: 'r.moduleSerial',
  researchId: 'r.researchId',
  senderVersion: 'r.senderVersion',
  senderOperator: 'r.senderOperator',
  notes: 'r.notes',
  errorCode: 'r.errorCode',
  errorNotes: 'r.errorNotes',
  assayName: 'a.name',
  assayId: 'r.assayId',
  sampleId: 'sp.externalId',
  sampleGroup: 'r.sampleGroup',
  sampleOriginSiteId: 'sp.originSiteId',
  sampleOriginSiteName: 'so.name',
  sampleTypeName: 'stp.name',
  patientId: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id"))'),
  requiresTreatment: knex.raw('GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0))'),
  treatmentStatusInfo: knex.raw(
    "case when GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end"
  ),
  patientData: 'r.patientData',
  resultWorkflowLogReason: 'rsl.reason',
  resultWorkflowLogOperator: 'rsl.operator',
  resultTreatmentMethod: 'rtsl.method',
  resultTreatmentData: 'rtsl.data',
  resultTreatmentStatusId: 'rtsl.resultTreatmentStatusId',
  reportableSiteId: 'r.reportableSiteId',
  reportableSiteName: 'sirep.name',
  transferredBy: 'ptr.name',
  resultStatusLogId: 'r.resultStatusLogId',
  patientCaseId: 'r.patientCaseId',
  caseExternalId: 'ca.externalId',
  diseaseId: 'dis.id',
  diseaseName: 'dis.name',
  diseaseExternalId: 'dis.externalId',
  // datetime fields UTC:
  startedOn: 'r.startedOn',
  endedOn: 'r.endedOn',
  resultWorkflowChangedOn: 'rsl.changedOn',
  consumableExpirationDate: 'r.consumableExpirationDate',
  createdOn: 'r.createdOn',
  updatedOn: 'r.updatedOn',
  sampleCollectedOn: 'sp.collectedOn',
  resultWorkflowLogCreatedOn: 'rsl.createdOn',
  resultWorkflowLogChangedOn: 'rsl.changedOn',
  resultTreatmentStatusChangedOn: 'rtsl.changedOn',
  transferredOn: 'rslog.createdOn',
  firstViewedOn: 'r.firstViewedOn',
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
const setTreatmentStatusLog = (resultId, treatmentStatusId, method, data, now, changedOn, userId) => {
  return knex('ResultTreatmentStatusLog').insert({
    resultId,
    resultTreatmentStatusId: treatmentStatusId,
    method,
    data,
    createdOn: now,
    changedOn,
    createdBy: userId,
  })
}

// feature: clinical response
const addResultFollowUp = (resultId, externalId, followUpId, date, createdBy, createdOn, updatedBy, updatedOn) => {
  return knex('ResultFollowUp').insert({
    resultId,
    externalId,
    followUpId,
    date,
    createdBy,
    createdOn,
    updatedBy,
    updatedOn,
  })
}

// feature: clinical response
const updateResult = (resultId, treatmentStatusLogId, userId, now) => {
  return knex('Result').where('id', resultId).update({
    treatmentStatusLogId,
    updatedBy: userId,
    updatedOn: now,
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
const getLatestResultWorkflowStatusId = resultId => {
  return knex('ResultWorkflowLog').where('resultId', resultId).select().orderBy('changedOn', 'desc').limit(1)
}

// feature: clinical response
const updateResultWorkflowLog = (resultWorkflowLogEntry, lastLogId, now) => {
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

/**
 * Knex result projection for use in @see {service.getResultByResultId}, excluding exports and reports. Datetime fields are in UTC.
 */
const SELECT_FIELDS_UTC = {
  ...COMMON_LIST_FIELDS_UTC,
  ...{
    formSchema: 'rf.formSchema',
    canEdit: knex.raw('IFNULL(pa.canEdit, 0)'),
    canDelete: knex.raw('IFNULL(pa.canDelete, 0)'),
    resultText: knex.raw(
      `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
    ),
    resultNotes: 'r.notes',
    resultCategory1Label: 'a.resultCategory1Label',
    resultCategory2Label: 'a.resultCategory2Label',
  },
}

module.exports = {
  generateResultQuery,
  getCount,
  getItems,
  getFollowUps,
  getComments,
  generateResultQueryV2,
  getCountV2,
  getAwaitingTreatment,
  getItemsV2,
  getFollowUpsV2,
  getCommentsV2,
  insertResultWorkflowLogQuery,
  updateResultWorkflowLogQuery,
  getResultWorkflowStatusQuery,
  addResultDownlodLogQuery,
  getCommentsOfResultById,
  getFollowUpsOfResultById,
  getFollowUpsForResultFollowup,
  getAffectedRowsbyResultFollowUp,
  generateResultQueryForResultFollowUp,
  SELECT_FIELDS_UTC,
  getAssayForResultFollowup,
  getFileReferencesForResultFolloup,
  showResultFolloup,
  getResultFollowUpsbyResultIdExternalId,
  getResultNotesByResultIdForResultFollowup,
  getResultFollowUps,
  getLastTreatmentStatusByResult,
  getTreatmentStatus,
  setTreatmentStatusLog,
  updateResult,
  getTreatmentStatusLogId,
  updateResultTreatmentStatusLog,
  addResultFollowUp,
  getLatestResultFollowUps,
  deleteResultFollowUp,
  insertResultWorkflowLog,
  updateResultWorkflowLog,
  getLatestResultWorkflowStatusId,
}
