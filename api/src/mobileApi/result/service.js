const _ = require('lodash')
const Promise = require('bluebird')
const { knex, sortPageParams } = require('../../db')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../../shared/date')
const logger = require('../../shared/logger')
const { getPageParams } = require('../../routes')

async function getDownloadResultsList(query, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
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
    .modify((queryBuilder, params) => {
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

  // get total count for paging
  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  // get rows
  const getItems = resultQuery
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

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await knex('ResultFollowUp as rfu')
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
  // get comments for all results in the response for performance (filter later)
  const comments = await knex('ResultNote as rn')
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

  const transformedData = _.map(data, d => ({
    id: d.id,
    externalId: d.externalId,
    endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
    updatedOn: d.updatedOn,
    assayExternalId: d.assayExternalId,
    siteName: d.siteName,
    sampleOriginSiteId: d.sampleOriginSiteId,
    firstViewedOn: d.firstViewedOn ? d.firstViewedOn : null,
    deviceName: d.deviceName,
    resultCategory1ExternalId: d.resultCategory1ExternalId,
    resultCategory2ExternalId: d.resultCategory2ExternalId,
    patientData: d.patientData ? JSON.parse(d.patientData) : null,
    resultData: d.resultData
      ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
      : null,
    sample: {
      id: d.sampleId,
      originSite: d.sampleOriginSiteId
        ? {
            externalId: d.sampleOriginSiteExternalId,
            name: d.sampleOriginSiteName,
          }
        : null,
    },
    workflowStatus: {
      name: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? 'Delivered' : d.resultWorkflowStatusName,
      externalId:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Delivered'
          : d.resultWorkflowStatusExternalId,
      i18nKey:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'ResultWorkflowStatusDelivered'
          : d.resultWorkflowStatusi18nKey,
      reason:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Download Results Api'
          : d.resultWorkflowStatusReason,
      changedOn:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? new Date() : d.resultWorkflowStatusChangedOn,
      setDelivered: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered',
    },
    treatmentStatus: {
      changedOn: d.resultTreatmentStatusChangedOn,
      name: d.resultTreatmentStatusName,
      externalId: d.resultTreatmentStatusExternalId,
      i18nKey: d.resultTreatmentStatusi18nKey,
    },
    followUps: _.sortBy(
      _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['date', 'updatedOn']
    ),
    comments: _.orderBy(
      _.filter(comments, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['createdOn'],
      ['desc']
    ),
    // result transferred
    reportableSiteName: d.reportableSiteName,
    transferredOn: d.transferredOn,
    transferredBy: d.transferredBy,
    reportableSiteId: d.reportableSiteId,
    diseaseExternalId: d.diseaseExternalId,
    diseaseName: d.diseaseName,
  }))
  const result = {
    ok: true,
    total,
    length: transformedData.length,
    data: transformedData,
  }

  return result
}

async function getDownloadResultsListV2(query, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const { size } = getPageParams(query)

  const resultQuery = knex('Result as r')
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
    .modify((queryBuilder, params) => {
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

  // get total count for paging
  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  // get total awaiting treatment count
  const getAwaitingTreatment = resultQuery
    .clone()
    .countDistinct('r.id as count')
    .whereNot('rc1.externalId', 'NotDetected')
    .first()

  // get rows
  const getItems = resultQuery
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
  // return result when both queries are finished
  const [{ count: total }, data, { count: awaitingTreatment }] = await Promise.all([
    getCount,
    getItems,
    getAwaitingTreatment,
  ])

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await knex('ResultFollowUp as rfu')
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
  // get comments for all results in the response for performance (filter later)
  const comments = await knex('ResultNote as rn')
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

  const transformedData = _.map(data, d => ({
    id: d.id,
    externalId: d.externalId,
    endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
    updatedOn: d.updatedOn,
    assayExternalId: d.assayExternalId,
    siteName: d.siteName,
    sampleOriginSiteId: d.sampleOriginSiteId,
    firstViewedOn: d.firstViewedOn ? d.firstViewedOn : null,
    deviceName: d.deviceName,
    resultCategory1ExternalId: d.resultCategory1ExternalId,
    resultCategory2ExternalId: d.resultCategory2ExternalId,
    patientData: d.patientData ? JSON.parse(d.patientData) : null,
    resultData: d.resultData
      ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
      : null,
    sample: {
      id: d.sampleId,
      originSite: d.sampleOriginSiteId
        ? {
            externalId: d.sampleOriginSiteExternalId,
            name: d.sampleOriginSiteName,
          }
        : null,
    },
    workflowStatus: {
      name: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? 'Delivered' : d.resultWorkflowStatusName,
      externalId:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Delivered'
          : d.resultWorkflowStatusExternalId,
      i18nKey:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'ResultWorkflowStatusDelivered'
          : d.resultWorkflowStatusi18nKey,
      reason:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Download Results Api'
          : d.resultWorkflowStatusReason,
      changedOn:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? new Date() : d.resultWorkflowStatusChangedOn,
      setDelivered: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered',
    },
    treatmentStatus: {
      changedOn: d.resultTreatmentStatusChangedOn,
      name: d.resultTreatmentStatusName,
      externalId: d.resultTreatmentStatusExternalId,
      i18nKey: d.resultTreatmentStatusi18nKey,
    },
    followUps: _.sortBy(
      _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['date', 'updatedOn']
    ),
    comments: _.orderBy(
      _.filter(comments, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['createdOn'],
      ['desc']
    ),
    // result transferred
    reportableSiteName: d.reportableSiteName,
    transferredOn: d.transferredOn,
    transferredBy: d.transferredBy,
    reportableSiteId: d.reportableSiteId,
    diseaseExternalId: d.diseaseExternalId,
    diseaseName: d.diseaseName,
  }))

  // total pages calculation (zero based)
  const totalPages = Math.ceil(total / size) - 1

  // Next page available or not calculation
  const nextPage = query.page < totalPages ? query.page + 1 : false

  const result = {
    ok: true,
    total,
    awaitingTreatment,
    length: transformedData.length,
    data: transformedData,
  }

  if (nextPage) {
    result.nextPage = nextPage
  }

  return result
}

async function downloadResultsListV2(request) {
  const { query, auth } = request
  const user = await getUser(auth.credentials.name)
  const results = await getDownloadResultsListV2(query, auth, true)
  const myProm = async () => {
    const idsToUpdate = _.uniq(
      _.map(
        _.pickBy(results.data, elem => elem.workflowStatus.setDelivered),
        elem => elem.id
      )
    )
    const idsToBeRegistered = _.uniq(_.map(results.data, elem => elem.id))
    if (idsToUpdate && idsToUpdate.length > 0) await updateResultWorkflowStatus(idsToUpdate, user.id, 'Delivered')
    if (idsToBeRegistered && idsToBeRegistered.length > 0) await addResultDownloadLog(idsToBeRegistered, user.id)
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return results
}

async function downloadResultsList(request) {
  const { query, auth } = request
  const user = await getUser(auth.credentials.name)
  const results = await getDownloadResultsList(query, auth, true)
  const myProm = async () => {
    const idsToUpdate = _.uniq(
      _.map(
        _.pickBy(results.data, elem => elem.workflowStatus.setDelivered),
        elem => elem.id
      )
    )
    const idsToBeRegistered = _.uniq(_.map(results.data, elem => elem.id))
    if (idsToUpdate && idsToUpdate.length > 0) await updateResultWorkflowStatus(idsToUpdate, user.id, 'Delivered')
    if (idsToBeRegistered && idsToBeRegistered.length > 0) await addResultDownloadLog(idsToBeRegistered, user.id)
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return results
}

async function updateResultWorkflowStatus(idsToUpdate, userId, resultWorkflowStatusExternalId) {
  const { id: resultWorkflowStatusId } = await knex('ResultWorkflowStatus')
    .where('externalId', resultWorkflowStatusExternalId)
    .first('id')
  const now = new Date()
  return Promise.each(idsToUpdate, async resultId => {
    const [resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      changedOn: now,
      createdOn: now,
      createdBy: userId,
      reason: 'Download Results Api',
      operator: 'Reporter App',
    })
    await knex('Result')
      .where({
        id: resultId,
      })
      .update({ resultWorkflowStatusLogId })
  })
}

async function addResultDownloadLog(idsToBeRegistered, userId) {
  const now = new Date()

  return Promise.each(idsToBeRegistered, async resultId =>
    knex('ResultDownloadLog').insert({
      resultId,
      createdOn: now,
      createdBy: userId,
    })
  )
}

module.exports = {
  downloadResultsList,
  downloadResultsListV2,
}
