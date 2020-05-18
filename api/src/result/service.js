const Boom = require('@hapi/boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { subDays } = require('date-fns')
const Promise = require('bluebird')
const {
  SELECT_COMMON_FIELDS,
  SELECT_SHOW_FIELDS,
  SORT_FIELDS,
  REPORT_COMMON_FIELDS,
  LIST_FIELDS,
  RESULT_STRING_TEMPLATE_FIELDS,
} = require('./querySelectors')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { resultUpdated, resultLoggedProcessed } = require('./actions')
const {
  addConstraints,
  canViewResults,
  getConstraints,
  addPartnerQueryConstraints,
} = require('../auth/constraints')
const { getUser, getUserByUserId } = require('../auth/service')
const {
  deviceTypeToId,
  resultWorkflowStatusToId,
  resultTreatmentStatusToId,
  resultStatusToId,
  resultSourceToId,
  resultTypeToId,
  resultCategoryToId,
} = require('../shared/dictionary')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../shared/date')
const { getPathFromFileReferenceId } = require('../file/service')
const { getSiteByPartnerCountry, getSite } = require('../site/service')
const { getDeviceByDeviceId } = require('../device/service')
const { updateTagsById } = require('../tag/service')
const { getCaseId } = require('../case/service')
const {
  getAllAssaySchemas,
  getAssayResultCategories,
} = require('../assay/service')
const { getRemoteAddress } = require('../shared/request')

const confirmedTreatmentTracking = require('./treatment')

async function getListResults(query, auth, fields = LIST_FIELDS) {
  const selectFields = _.clone(fields)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = await knex('Assay as a')
      .where('a.id', query.assayId)
      .first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
      assayColumns.push({
        db: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey,
      })
    }

    const resultDataSchema = JSON.parse(assay.resultDataSchema)
    _.each(resultDataSchema, (value, key) => {
      if (value.list) {
        selectFields.push(
          knex.raw('JSON_EXTRACT(resultData, ?) as ?', [
            `$.${key}`,
            key.replace('.', '_'),
          ])
        )

        sortableFields.push(key.replace('.', '_'))

        assayColumns.push({
          db: key.replace('.', '_'),
          type: value.type,
          title: value.title,
          i18nKey: value.i18nKey,
        })
      }
    })
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = getQueryForResultsListAndExport(query, dataConstraints)
  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('r.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  // if assay specified columns from the resultData field, parse them to valid JSON
  if (assayColumns) {
    _.each(data, d => {
      _.each(assayColumns, c => {
        if (c && c.db.indexOf('resultCategory') === -1) {
          const path = c.db.replace('.', '_')
          _.set(d, path, JSON.parse(d[path]))
        }
      })
    })
  }

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }
  return result
}

function getResultTreatmentStatus(response) {
  if (response.requiresTreatment) {
    const today = new Date()
    const lastSixteenDays = subDays(today, 16)
    const lastThirtyTwoDays = subDays(today, 32)
    const isPastThirtyTwoDays = response.endedOn <= lastThirtyTwoDays
    const isPastSixteenDays =
      response.endedOn <= lastSixteenDays &&
      response.endedOn > lastThirtyTwoDays
    if (response.resultTreatmentStatus === 'OnTreatment') {
      response.treatmentStatusInfo = 'ok'
    } else if (response.resultTreatmentStatus === 'NotPossible') {
      response.treatmentStatusInfo = 'na'
    } else if (isPastThirtyTwoDays) {
      response.treatmentStatusInfo = 'alert'
    } else if (isPastSixteenDays) {
      response.treatmentStatusInfo = 'warning'
    } else {
      response.treatmentStatusInfo = 'na'
    }
  } else {
    response.treatmentStatusInfo = null
  }
}

async function exportResults(query, auth) {
  const selectFields = _.clone(SELECT_COMMON_FIELDS)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = await knex('Assay as a')
      .where('a.id', query.assayId)
      .first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
    }
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = getQueryForResultsListAndExport(query, dataConstraints)
  const data = await resultQuery
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)

  const result = {
    ok: true,
    data,
  }

  return result
}

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

async function getDownloadResultsList(query, auth, setDelivered = false) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = getBaseQueryForResults()
    .leftJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rca2', function() {
      this.on('r.assayId', 'rca2.assayId').andOn(
        'r.resultCategory2',
        'rca2.resultCategoryId'
      )
    })
    // only results which are reportable for either ResultCategory
    .where(builder =>
      builder.where('rca.reportable', 1).orWhere('rca2.reportable', 1)
    )
    .whereIn('rs.externalId', [
      'Deliverable',
      'Delivered',
      'Acknowledged',
      'Flagged',
    ])
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
              knex.raw(
                'LOWER(JSON_EXTRACT(patientData,"$.firstName")) like LOWER(JSON_QUOTE(?))',
                [`%${params.patientSample}%'`]
              )
            )
            .orWhere(
              knex.raw(
                'LOWER(JSON_EXTRACT(patientData,"$.lastName")) like LOWER(JSON_QUOTE(?))',
                [`%${params.patientSample}%`]
              )
            )
            .orWhere(
              knex.raw(
                'LOWER(JSON_EXTRACT(patientData,"$.name")) like LOWER(JSON_QUOTE(?))',
                [`%${params.patientSample}%`]
              )
            )
            .orWhere(
              knex.raw(
                'LOWER(JSON_EXTRACT(patientData,"$.id")) like LOWER(JSON_QUOTE(?))',
                [`%${params.patientSample}%`]
              )
            )
        )
      }
      if (params.assayExternalIds) {
        queryBuilder.whereIn('a.externalId', params.assayExternalIds.split(','))
      }
      if (params.diseaseExternalIds)
        queryBuilder.whereIn(
          'dis.externalId',
          params.diseaseExternalIds.split(',')
        )

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
      if (params.treatmentStatus)
        queryBuilder.where('rts.externalId', params.treatmentStatus)
      if (params.deviceType)
        queryBuilder.where('dt.externalId', params.deviceType)
      else
        queryBuilder.whereIn('dt.externalId', [
          'CepheidGeneXpert',
          'Aspect',
          'rocheMagnaPure96',
          'appliedBiosystemsQuantStudio7Flex',
        ])
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
  const getCount = resultQuery
    .clone()
    .count('r.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
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
      ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log'])
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
      name:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Delivered'
          : d.resultWorkflowStatusName,
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
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? new Date()
          : d.resultWorkflowStatusChangedOn,
      setDelivered:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered',
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
    if (idsToUpdate && idsToUpdate.length > 0)
      await updateResultWorkflowStatus(idsToUpdate, user.id, 'Delivered')
    if (idsToBeRegistered && idsToBeRegistered.length > 0)
      await addResultDownloadLog(idsToBeRegistered, user.id)
  }
  // eslint-disable-next-line no-console
  await myProm().catch(err => console.log(err))
  return results
}

async function addResultDownloadLog(idsToBeRegistered, userId) {
  const now = new Date()

  await Promise.each(idsToBeRegistered, async resultId => {
    await knex('ResultDownloadLog').insert({
      resultId,
      createdOn: now,
      createdBy: userId,
    })
  })
}

async function updateResultWorkflowStatus(
  idsToUpdate,
  userId,
  resultWorkflowStatusExternalId
) {
  const { id: resultWorkflowStatusId } = await knex('ResultWorkflowStatus')
    .where('externalId', resultWorkflowStatusExternalId)
    .first('id')
  const now = new Date()
  await Promise.each(idsToUpdate, async resultId => {
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

async function showResult(request) {
  const {
    params: { resultId },
    auth,
  } = request

  const result = await getResultByResultId(auth, resultId)
  return result.ok ? result : Boom.notFound()
}

async function showDeviceLogs(request) {
  const result = await getDeviceLogsByResultId(request)
  return result
}

async function getDeviceLogsByResultId(request) {
  const { params, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceLogs = await knex('DeviceLog as dl')
    .innerJoin('Device as d', 'dl.deviceId', 'd.id')
    .where('dl.resultId', params.resultId)
    .orderBy('createdOn', 'desc')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(
      'dl.createdOn',
      'dl.deviceOperationId',
      'dl.source',
      'dl.deviceConfigurationUpdated',
      'dl.senderIp',
      'dl.rawMessage'
    )
    .limit(50)
  return { data: deviceLogs }
}

async function showFileReferences(request) {
  const {
    params: { resultId },
    auth,
  } = request

  return showFileReferencesById(auth, resultId)
}

async function showFileReferencesById(auth, resultId) {
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReferences = await knex('ResultFileReference as rf')
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
    .then(items =>
      items.map(ref => {
        ref.url = `/result/file/${resultId}/${ref.id}/${ref.name}`
        return ref
      })
    )
  return { data: fileReferences }
}

function downloadFile(request, reply) {
  return downloadFileAsync(request)
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      throw err
    })
}

function downloadFirstImage(request, reply) {
  const {
    auth,
    params: { resultId },
  } = request
  return downloadFileAsync({ auth, params: { resultId, mimeType: 'image' } })
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      throw err
    })
}

async function downloadFileAsync({ auth, params }) {
  const { resultId, fileReferenceId, fileName, mimeType } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReference = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { device: 'd', result: 'r' })
    .where('rf.resultId', resultId)
    .modify(qb => {
      if (fileReferenceId != null) {
        qb.where('f.id', fileReferenceId)
      }
      if (fileName != null) {
        qb.where('f.name', fileName)
      }
      if (mimeType != null) {
        qb.where('fct.mimeType', mimeType)
      }
    })
    .orderBy('f.id', 'desc')
    .first('f.id')
  if (fileReference == null) {
    throw Boom.notFound('Cannot find file')
  }
  return getPathFromFileReferenceId(knex, fileReference.id)
}

async function getResultByResultId(
  auth,
  resultId,
  fields = SELECT_SHOW_FIELDS
) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { userName } = await getUser(auth.credentials.name)

  const results = await getBaseQueryForResults()
    .leftJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rca2', function() {
      this.on('r.assayId', 'rca2.assayId').andOn(
        'r.resultCategory2',
        'rca2.resultCategoryId'
      )
    })
    .leftJoin('ResultForm as rf', function() {
      this.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .where('r.id', resultId)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
    })
    .select(fields)

  let data = null

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
    }
    if (data.formSchema) {
      data.formSchema = JSON.parse(data.formSchema)
    }
    if (data.formData) {
      data.formData = JSON.parse(data.formData)
    }
    if (data.patientData) {
      data.patientData = JSON.parse(data.patientData)
    }
    if (data.assayId) {
      data.assay = await knex('Assay as a')
        .join('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
        .where('a.id', data.assayId)
        .first('a.*', 'dt.externalId as deviceTypeExternalId')
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferencesById(auth, resultId)
    data.files = files

    const { data: followUps } = await showResultFollowUps(
      resultId,
      dataConstraints
    )
    data.followUps = followUps
  }

  if (data) {
    getResultTreatmentStatus(data)
    data.resultNotes = await getResultNotesByResultId(resultId)
    data.resultTreatmentStatusCreatedBy = userName
  }

  return { ok: results.length === 1, data }
}

async function getResultForStringTemplateProcessing(
  resultId,
  fields = RESULT_STRING_TEMPLATE_FIELDS,
  knex = knex
) {
  return knex('Result as r')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .join('Site as s', 'r.siteId', 's.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sample', 'r.sampleId', 'sample.id')
    .join('Partner as p', 'r.partnerId', 'p.id')
    .leftJoin('ResultForm as rf', function() {
      this.on('a.id', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .leftJoin('PartnerDisease as pd', function() {
      this.on('at.diseaseId', 'pd.diseaseId').andOn(
        'r.partnerId',
        'pd.partnerId'
      )
    })
    .leftJoin('Case as c', 'r.caseId', 'c.id')
    .leftJoin('Site as sos', 'sample.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategoryAssay as rca1', function() {
      this.on('r.resultCategory1', 'rca1.resultCategoryId').andOn(
        'r.assayId',
        'rca1.assayId'
      )
    })
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultCategoryAssay as rca2', function() {
      this.on('r.resultCategory2', 'rca2.resultCategoryId').andOn(
        'r.assayId',
        'rca2.assayId'
      )
    })
    .where({ 'r.id': resultId })
    .first(...fields)
}

async function getResultNotesByResultId(resultId) {
  const resultNotes = await knex('ResultNote as rn')
    .leftJoin('User as u', 'rn.createdBy', 'u.id')
    .leftJoin('ResultNoteType as rt', 'rt.id', 'rn.resultNoteTypeId')
    .where('rn.resultId', resultId)
    .orderBy('rn.createdOn', 'desc')
    .select(
      'u.name as createdBy',
      'rn.text',
      'rn.id',
      'rn.changedOn',
      'rn.createdOn',
      'rt.name as noteType'
    )

  return resultNotes
}

async function listResultTypes(request) {
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt').modify(filterParams, query, {
    name: 'rt.name',
  })

  // get total count for paging
  const getCount = resultTypeQuery
    .clone()
    .count('rt.id as count')
    .first()

  // get rows
  const getItems = resultTypeQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function updateWorkflowStatus(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }
  const { resultWorkflowStatusId } = payload
  const { changedOn, operator, reason, updatedOn } = payload

  const resultWorkflowLogEntry = {
    resultId,
    resultWorkflowStatusId,
    createdBy: currentUserId,
    operator,
    reason,
    changedOn: changedOn || new Date(),
  }

  const errorMessage = await updateResultWorkflowStatusByResultId(
    knex,
    resultWorkflowLogEntry,
    payload.externalId,
    updatedOn,
    result.data.resultWorkflowStatusId,
    result.data.resultWorkflowChangedOn
  )

  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }

  const response = await showResult(request)
  return response
}

async function updateResultWorkflowStatusByResultId(
  knex,
  resultWorkflowLogEntry,
  resultWorkflowStatusExternalId,
  updatedOn,
  currentResultWorkflowStatusId,
  resultWorkflowChangedOn
) {
  const now = new Date()

  // check if a externalId is provided
  if (resultWorkflowStatusExternalId) {
    resultWorkflowLogEntry.resultWorkflowStatusId = await resultWorkflowStatusToId(
      resultWorkflowStatusExternalId
    )
    if (!resultWorkflowLogEntry.resultWorkflowStatusId) {
      return 'Invalid ResultWorkflowStatus ID'
    }
  }

  // update the resultWorkflowStatusId.
  if (
    resultWorkflowLogEntry.resultWorkflowStatusId !==
    currentResultWorkflowStatusId
  ) {
    const [lastLogId] = await knex('ResultWorkflowLog').insert(
      resultWorkflowLogEntry
    )

    if (!updatedOn || resultWorkflowChangedOn < updatedOn) {
      await knex('Result')
        .where('id', resultWorkflowLogEntry.resultId)
        .update({
          resultWorkflowStatusLogId: lastLogId,
          updatedBy: resultWorkflowLogEntry.createdBy,
          updatedOn: now,
        })
    }
  }
}

async function listTreatmentStatusTypes() {
  const resultQuery = knex('ResultTreatmentStatus as rsl')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('rsl.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function updateTreatmentStatusPost(request) {
  const {
    auth,
    payload,
    params: { resultId },
  } = request
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    Boom.notFound()
  }

  const {
    resultTreatmentStatusId,
    externalId,
    data,
    method,
    changedOn,
  } = payload

  return updateTreatmentStatus(
    request,
    currentUserId,
    result,
    resultTreatmentStatusId,
    externalId,
    data,
    method,
    changedOn
  )
}

async function updateTreatmentStatus(
  request,
  currentUserId,
  result,
  resultTreatmentStatusId,
  resultTreatmentStatusExternalId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  const lastTreatment = await updateTreatmentStatusByResultId(
    currentUserId,
    result.data.id,
    result.data.resultTreatmentStatusId,
    resultTreatmentStatusExternalId,
    resultTreatmentStatusId,
    data,
    method,
    changedOn
  )

  const response = await showResult(request)
  response.data.treatmentStatus = lastTreatment

  if (!response.data.resultTreatmentStatusCreatedOn) {
    response.data.resultTreatmentStatusCreatedOn =
      result.data.endedOn || result.data.startedOn || now
  }

  return response
}

async function updateTreatmentStatusByResultId(
  userId,
  resultId,
  currentTreatmentStatusId,
  resultTreatmentStatusExternalId,
  resultTreatmentStatusId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  let treatmentStatusId = null
  // check if a externalId is provided
  if (resultTreatmentStatusExternalId) {
    treatmentStatusId = await resultTreatmentStatusToId(
      resultTreatmentStatusExternalId
    )
    if (!treatmentStatusId) {
      return Boom.badRequest('Invalid externalId')
    }
  } else if (resultTreatmentStatusId) {
    // check if value of resultTreatmentStatusId is valid
    const treatmentStatus = await knex('ResultTreatmentStatus')
      .where('id', resultTreatmentStatusId)
      .first()
    if (!treatmentStatus) {
      return Boom.badRequest('Invalid resultTreatmentStatusId')
    }
    treatmentStatusId = resultTreatmentStatusId
  }
  let lastTreatment = await getLastTreatmentStatusByResult(resultId)
  if (treatmentStatusId !== currentTreatmentStatusId && treatmentStatusId) {
    const [treatmentStatusLogId] = await knex(
      'ResultTreatmentStatusLog'
    ).insert({
      resultId,
      resultTreatmentStatusId: treatmentStatusId,
      method,
      data,
      createdOn: now,
      changedOn,
      createdBy: userId,
    })

    if (
      !lastTreatment ||
      (lastTreatment && lastTreatment.changedOn < changedOn)
    ) {
      await knex('Result')
        .where('id', resultId)
        .update({
          treatmentStatusLogId,
          updatedBy: userId,
          updatedOn: now,
        })
      lastTreatment = await getLastTreatmentStatusByResult(resultId)
    }
  }

  if (data) {
    const [{ treatmentStatusLogId }] = await knex('Result')
      .where('id', resultId)
      .select('treatmentStatusLogId')
    await knex('ResultTreatmentStatusLog')
      .where('id', treatmentStatusLogId)
      .update({
        data,
        changedOn,
      })
  }

  return lastTreatment
}

// helper func
async function isAuthorOrAdminOfResultComment(
  credentials,
  resultId,
  commentId
) {
  const user = await getUser(credentials.name)
  const { createdBy } = await knex('ResultNote')
    .where('id', commentId)
    .where('resultId', resultId)
    .first()
  const isResultAdmin = credentials.permissions.includes(`result:admin`)
  return createdBy === user.id || isResultAdmin
}

async function addResultNote(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  const { note, resultNoteType, commentId, changedOn = now } = payload

  const { id: resultNoteTypeId } = await knex('ResultNoteType')
    .where('externalId', resultNoteType || 'General')
    .first('id')

  if (!resultNoteTypeId) {
    return Boom.notFound()
  }

  if (note.length > 255) {
    return Boom.badRequest('The length of the comment must be less than 256')
  }

  if (commentId) {
    const canEdit = await isAuthorOrAdminOfResultComment(
      auth.credentials,
      resultId,
      commentId
    )
    if (!canEdit) {
      return Boom.forbidden('This user can not edit comment')
    }

    await knex('ResultNote')
      .where({ id: commentId, resultId })
      .update({
        text: note,
        changedOn,
        updatedBy: currentUserId,
      })
  } else {
    await knex('ResultNote').insert({
      resultNoteTypeId,
      resultId,
      text: note,
      changedOn,
      createdOn: now,
      updatedBy: currentUserId,
      createdBy: currentUserId,
    })
  }

  const resultNotes = await getResultNotesByResultId(resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function deleteResultNote(request) {
  const { auth, params } = request
  const { resultId, commentId } = params

  // get the result so we can check access
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  const canDelete = await isAuthorOrAdminOfResultComment(
    auth.credentials,
    resultId,
    commentId
  )
  if (!canDelete) {
    return Boom.forbidden('This user can not delete comment')
  }

  await knex('ResultNote')
    .where('id', commentId)
    .where('resultId', resultId)
    .del()

  const resultNotes = await getResultNotesByResultId(resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function allResultNotes(request) {
  const {
    params: { resultId },
    auth,
  } = request

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  const resultNotes = await getResultNotesByResultId(resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function getLastTreatmentStatusByResult(resultId) {
  return knex('Result as r')
    .innerJoin(
      'ResultTreatmentStatusLog as rtl',
      'r.treatmentStatusLogId',
      'rtl.id'
    )
    .innerJoin(
      'ResultTreatmentStatus as ts',
      'rtl.resultTreatmentStatusId',
      'ts.id'
    )
    .where('rtl.resultId', resultId)
    .orderBy('rtl.changedOn', 'desc')
    .first('rtl.changedOn', 'ts.name', 'ts.externalId', 'ts.i18nKey')
}

async function getTreatmentStatusByResultId(resultId) {
  return knex('Result as r')
    .innerJoin(
      'ResultTreatmentStatusLog as rtl',
      'r.treatmentStatusLogId',
      'rtl.id'
    )
    .innerJoin(
      'ResultTreatmentStatus as ts',
      'rtl.resultTreatmentStatusId',
      'ts.id'
    )
    .where('rtl.resultId', resultId)
    .first(
      'rtl.id as treatmentStatusLogId',
      'rtl.data',
      'rtl.method',
      'rtl.changedOn',
      'ts.name',
      'ts.externalId',
      'ts.i18nKey'
    )
}

async function updateFormData(request) {
  const {
    auth,
    params,
    payload,
    plugins: { messageContext },
  } = request
  const { resultId } = params

  const result = await getResultByResultId(auth, resultId, [
    'r.assayId',
    'r.partnerId',
    'r.formData',
  ])
  if (!result.ok) {
    return Boom.notFound()
  }

  const errorMessage = await updateFormDataByResultId(
    resultId,
    result.data.partnerId,
    result.data.assayId,
    _.get(result.data, 'formData', {}),
    payload,
    auth,
    messageContext,
    getRemoteAddress(request),
    params
  )

  if (errorMessage) {
    return Boom.badRequest(errorMessage)
  }

  const response = await showResult(request)
  return response
}

async function updateFormDataByResultId(
  resultId,
  partnerId,
  assayId,
  existingFormData,
  newFormData,
  auth,
  messageContext,
  senderIp,
  params
) {
  const now = new Date()
  const mergedFormData = _.merge({}, existingFormData, newFormData)
  if (!_.isEqual(existingFormData, mergedFormData)) {
    const resultForm = await knex('ResultForm')
      .where({
        partnerId,
        assayId,
      })
      .first('formSchema')

    if (!resultForm || _.isEmpty(resultForm.formSchema)) {
      return 'This result cannot accept form data because no form schema is defined.'
    }
    const formSchema = JSON.parse(resultForm.formSchema)
    const unrecognisedFields = _.difference(
      Object.keys(newFormData),
      Object.keys(formSchema.fields)
    )
    if (!_.isEmpty(unrecognisedFields)) {
      const undefinedFieldMessage =
        unrecognisedFields.length > 1
          ? `This result cannot accept the following fields in it's form data: [${unrecognisedFields.join()}] because they are not defined in the forms schema.`
          : `This result cannot accept the following field in it's form data: ${unrecognisedFields[0]} because it is not defined in the forms schema.`
      return undefinedFieldMessage
    }
    const fieldValidationErrors = []
    _.each(Object.keys(newFormData), formFieldKey => {
      const formFieldValue = _.get(newFormData, formFieldKey)
      const formFieldSchema = _.get(formSchema, ['fields', formFieldKey])
      if (!_.isNil(formFieldValue)) {
        const allowMultipleSelection = _.get(
          formFieldSchema,
          'control.allowMultipleSelection',
          true
        )
        const formFieldOptions = _.get(formFieldSchema, 'control.options')
        if (formFieldOptions) {
          const allowedValues = _.map(formFieldOptions, 'value')
          if (_.isArray(formFieldValue)) {
            if (!allowMultipleSelection && formFieldValue.length > 1) {
              fieldValidationErrors.push(
                `[${formFieldValue.join()}] is invalid for ${formFieldKey} because the field does not allow multiple values.`
              )
            }
            const illegalValuesEntered = _.difference(
              formFieldValue,
              allowedValues
            )
            if (!_.isEmpty(illegalValuesEntered)) {
              const validationMessage =
                illegalValuesEntered.length === 1
                  ? `${illegalValuesEntered[0]} is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
                  : `[${illegalValuesEntered.join()}] are invalid for ${formFieldKey} because they are not present in the options configured for the field.`
              fieldValidationErrors.push(validationMessage)
            }
          } else if (!allowedValues.includes(formFieldValue.toString())) {
            fieldValidationErrors.push(
              `${formFieldValue} is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
            )
          }
        }
      }
    })
    if (!_.isEmpty(fieldValidationErrors)) {
      return fieldValidationErrors.join('\n')
    }
    messageContext.bindActionCreators({
      resultUpdated,
    })
    const { id: currentUserId } = await getUser(auth.credentials.name)
    let deviceLogId
    await messageContext.transact(async knex => {
      const updatedResult = {
        formData: JSON.stringify(mergedFormData),
        updatedBy: currentUserId,
        updatedOn: now,
      }

      await knex('Result')
        .where('id', resultId)
        .update(updatedResult)

      const deviceId = await getAspectDeviceId(partnerId)

      if (deviceId) {
        ;[deviceLogId] = await knex('DeviceLog').insert({
          deviceId,
          resultId,
          source: 'Result Edited in Aspect',
          createdOn: now,
          senderIp,
          rawMessage: JSON.stringify({
            auth: { credentials: { name: auth.credentials.name } },
            params,
            payload: newFormData,
          }),
        })
      }

      messageContext.resultUpdated(resultId, deviceLogId, currentUserId)
    })
    if (deviceLogId) {
      await messageContext.queue
        .waitForAction(resultLoggedProcessed(resultId, deviceLogId), 1000)
        .catch(_.noop)
    }
  }
}

async function getAspectDeviceId(partnerId) {
  const aspectDeviceTypeId = await deviceTypeToId('Aspect')
  if (aspectDeviceTypeId) {
    const { id: deviceId } =
      (await knex('Device')
        .where({
          partnerId,
          deviceTypeId: aspectDeviceTypeId,
        })
        .first('id')) || {}
    if (deviceId) {
      return deviceId
    }
  }
}

async function listWorkflowStatusTypes() {
  const resultQuery = knex('ResultWorkflowStatus as rs')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('rs.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listWorkflowStatusLog(request) {
  const result = await getWorkflowStatusLogByResultId(request)
  return result.ok ? result : Boom.notFound()
}

async function getWorkflowStatusLogByResultId(request) {
  const { query, params } = request

  const selectFields = [
    'log.id',
    'log.operator',
    'log.changedOn',
    'log.createdOn',
    'log.createdBy',
    'rs.name as statusName',
    'rs.i18nKey',
    'rs.externalId',
  ]
  const sortableFields = ['operator', 'changedOn', 'statusName']

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const resultQuery = knex('ResultWorkflowLog as log')
    .innerJoin(
      'ResultWorkflowStatus as rs',
      'log.resultWorkflowStatusId',
      'rs.id'
    )
    .where('log.resultId', params.resultId)

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('log.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'changedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function createUniqueIdForResult(
  instrumentSerial,
  testStartedOn,
  testEndedOn,
  sampleId
) {
  if (!instrumentSerial || !testStartedOn || !testEndedOn || !sampleId) {
    return null
  }
  const hashedSampleId = oneDirectionalMd5Hash(sampleId)
  const uniqueId = `${instrumentSerial}_${dateFormat(
    testStartedOn,
    'mmss'
  ).substr(1)}${dateFormat(testEndedOn, 'mmss').substr(
    1
  )}_${hashedSampleId.substr(0, 8)}`
  return uniqueId
}

async function listFollowUps(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const queryBuilder = knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .join('FollowUpAssay as fua', 'fu.id', 'fua.followUpId')
    .leftJoin('Assay as a', 'fua.assayId', 'a.id')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin('ResultCategory as rc1', 'fua.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'fua.resultCategory2', 'rc2.id')
    .where(queryBuilder => {
      queryBuilder.where('fua.partnerId', dataConstraints.partner.id)
      if (query.diseaseId) queryBuilder.where('dis.id', query.diseaseId)
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      disease: 'dis',
    })
    .orderBy('fu.id', 'a.id', 'rc1.id', 'rc2.id')
    .select(
      'fu.id',
      'fu.name',
      'fu.externalId',
      'fu.i18nKey',
      'fut.id as followUpTypeId',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId',
      'fut.i18nKey as followUpTypeI18nKey',
      'a.id as assayId',
      'a.name as assayName',
      'a.externalId as assayExternalId',
      'a.i18nKey as assayI18nKey',
      'rc1.id as resultCategory1Id',
      'rc1.name as resultCategory1Name',
      'rc1.externalId as resultCategory1ExternalId',
      'rc1.i18nKey as resultCategory1I18nKey',
      'rc2.id as resultCategory2Id',
      'rc2.name as resultCategory2Name',
      'rc2.externalId as resultCategory2ExternalId',
      'rc2.i18nKey as resultCategory2I18nKey'
    )

  if (query.typeId) {
    queryBuilder.where('fu.followUpTypeId', query.typeId)
  }

  if (query.assayId) {
    queryBuilder.where(function() {
      this.where('fua.assayId', query.assayId).orWhereNull('fua.assayId')
    })
  }

  if (query.resultCategory1) {
    queryBuilder.where(function() {
      this.where('fua.resultCategory1', query.resultCategory1)
    })
  }

  if (query.resultCategory2) {
    queryBuilder.where(function() {
      this.where('fua.resultCategory2', query.resultCategory2)
    })
  }

  const data = await queryBuilder

  // convert data to nested JSON
  const followUps = _.uniqBy(data, 'id').map(f =>
    Object.assign(
      _.pick(f, ['id', 'name', 'externalId', 'i18nKey']),
      {
        type: {
          id: f.followUpTypeId,
          name: f.followUpTypeName,
          externalId: f.followUpTypeExternalId,
          i18nKey: f.followUpTypeI18nKey,
        },
      },
      {
        assays: _.uniqBy(
          data.filter(d => d.id === f.id && d.assayId),
          'assayId'
        ).map(a =>
          Object.assign(
            _.mapKeys(
              _.pick(a, [
                'assayId',
                'assayName',
                'assayExternalId',
                'assayI18nKey',
              ]),

              (v, k) => _.lowerFirst(k.replace('assay', ''))
            ),
            {
              resultCategories: _.uniqBy(
                data.filter(
                  d =>
                    d.id === f.id &&
                    d.assayId === a.assayId &&
                    d.resultCategory1Id
                ),
                r => `${r.resultCategory1Id}-${r.resultCategory2Id}`
              ).map(r => ({
                category1: _.mapKeys(
                  _.pick(r, [
                    'resultCategory1Id',
                    'resultCategory1Name',
                    'resultCategory1ExternalId',
                    'resultCategory1I18nKey',
                  ]),
                  (v, k) => _.lowerFirst(k.replace('resultCategory1', ''))
                ),
                category2: _.mapKeys(
                  _.pick(r, [
                    'resultCategory2Id',
                    'resultCategory2Name',
                    'resultCategory2ExternalId',
                    'resultCategory2I18nKey',
                  ]),
                  (v, k) => _.lowerFirst(k.replace('resultCategory2', ''))
                ),
              })),
            }
          )
        ),
      }
    )
  )

  const result = {
    ok: true,
    total: followUps.length,
    length: followUps.length,
    data: followUps,
  }

  return result
}

async function setResultFollowUp(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  const { externalId, followUpId, followUpExternalId, date } = payload

  const followUp = await knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .orWhere('fu.id', followUpId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')

  if (!followUp) {
    return Boom.badRequest('Invalid follow up ID')
  }

  if (externalId) {
    const resultFollowUp = await knex('ResultFollowUp')
      .where('resultId', resultId)
      .where('externalId', externalId)
      .first('id')

    if (resultFollowUp) {
      return Boom.badRequest(
        'This result already has a follow up with this external ID.'
      )
    }
  }

  await knex('ResultFollowUp').insert({
    resultId,
    externalId,
    followUpId: followUp.id,
    date,
    createdBy: currentUserId,
    createdOn: now,
    updatedBy: currentUserId,
    updatedOn: now,
  })

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function updateResultFollowUp(request) {
  const now = new Date()
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId, followUpId, followUpExternalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  const followUp = await knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .orWhere('fu.id', followUpId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')

  const affectedRows = await knex('ResultFollowUp')
    .where('id', id || '-1')
    .orWhere(function() {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .update({
      date,
      updatedOn: now,
      updatedBy: currentUserId,
      followUpId: knex.raw(
        'ifnull(?, followUpId)',
        followUp ? followUp.id : null
      ),
    })

  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function deleteResultFollowUp(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  await knex('ResultFollowUp')
    .where('id', id || '-1')
    .orWhere(function() {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .del()

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function updateTreatmentStatusBasedOnFollowUps(
  request,
  currentUserId,
  result,
  date,
  data,
  method
) {
  const followUps = await knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', result.data.id)
    .select('f.externalId', 't.externalId as followUpTypeExternalId')
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (
    _.find(
      followUps,
      f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured'
    )
  ) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(
    request,
    currentUserId,
    result,
    null,
    treatmentStatusExternalId,
    data,
    method
  )
}

async function showResultFollowUps(resultId, dataConstraints) {
  const followUps = await knex('ResultFollowUp as rfu')
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
  return { data: followUps }
}

async function transferResult(request) {
  const {
    auth,
    params: { resultId },
    payload: { siteId, timestamp },
  } = request
  const { partnerId, countryId, id: currentUserId, userName } = await getUser(
    auth.credentials.name
  )

  // get the result so we can check access
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound('Result with requested Id is not found')
  }

  // check if target site exists in current user's country and partner
  const site = await getSiteByPartnerCountry(siteId, { partnerId, countryId })
  if (!site) {
    return Boom.notFound('Requested site not found')
  }

  const resultStatusId = await resultStatusToId('Transfer')
  if (!resultStatusId) {
    return Boom.badRequest('Invalid externalId `Transfer`')
  }

  // get item if timeStamp of prev action is newer than current timeStamp
  let resultStatusLog = await knex('ResultStatusLog')
    .whereNotNull('timestamp')
    .where('timestamp', '>', timestamp)
    .where({ resultId, resultStatusId })
    .first('createdOn', 'createdBy')

  let resultStatusLogId
  let transferredOn
  let transferredBy = userName
  if (resultStatusLog) {
    // ^^^
    // prev transfer is newer than current - get its props and skip current action
    // ---
    resultStatusLogId = resultStatusLog.id
    transferredOn = resultStatusLog.createdOn
    const author = await getUserByUserId(resultStatusLog.createdBy)
    transferredBy = author ? author.userName : '?'
  } else {
    // ^^^
    // current action is newer
    // ---
    const now = new Date()

    // log
    ;[resultStatusLogId] = await knex('ResultStatusLog').insert({
      resultId,
      resultStatusId,
      createdOn: now,
      createdBy: currentUserId,
      data: JSON.stringify({
        siteId: result.siteId,
        reportableSiteId: siteId,
        sampleOriginSiteId: result.sampleOriginSiteId,
      }),
      timestamp,
    })
    resultStatusLog = await knex('ResultStatusLog')
      .where({ id: resultStatusLogId })
      .first('createdOn')
    transferredOn = resultStatusLog.createdOn

    // remove ResultFollowUp because we want the user at the clinic that now has access
    // to the result to confirm the treatment status.
    await knex('ResultFollowUp')
      .where({ resultId })
      .del()
    // add entry to ResultTreatmentStatusLog as "Awaiting Treatment" with details about reason
    const externalId = 'AwaitingTreatment'
    const resultTreatmentStatusId = await resultTreatmentStatusToId(externalId)
    const [treatmentStatusLogId] = await knex(
      'ResultTreatmentStatusLog'
    ).insert({
      resultId,
      resultTreatmentStatusId,
      method: 'transfer',
      data: JSON.stringify({
        siteId: result.siteId,
        reportableSiteId: siteId,
        sampleOriginSiteId: result.sampleOriginSiteId,
      }),
      createdOn: now,
      changedOn: now,
      createdBy: currentUserId,
    })
    // ------------

    // update
    await knex('Result')
      .where('id', resultId)
      .update({
        reportableSiteId: siteId,
        resultStatusLogId,
        treatmentStatusLogId,
        firstViewedOn: null,
        updatedBy: currentUserId,
        updatedOn: now,
      })

    result.data.reportableSiteId = siteId
    result.data.reportableSiteName = site.name
  }

  const currTreatmentStatus = await getTreatmentStatusByResultId(resultId)

  // func getResultByResultId(request) does not return now current result because
  // r.reportableSiteId now has changed and may not equal to user's siteId's -
  // so we here simply update few fields affected by transfer and return old result
  result.data.transferredOn = transferredOn
  result.data.transferredBy = transferredBy
  result.data.resultStatusLogId = resultStatusLogId
  result.data.firstViewedOn = null
  result.data.treatmentStatus = _.pick(currTreatmentStatus, [
    'changedOn',
    'name',
    'externalId',
    'i18nKey',
    'method',
    'data',
  ])
  result.data.followUps = []

  return result
}

async function updateTransferNotification(request) {
  const {
    params: { resultId },
    payload: { firstViewedOn },
    auth,
  } = request

  const result = await getResultByResultId(auth, resultId)

  if (!result.ok) {
    return Boom.notFound('Result with requested Id is not found')
  }

  if (result.data.firstViewedOn) {
    return Boom.badRequest('Result has already been viewed')
  }

  await knex('Result as r')
    .where('r.id', resultId)
    .update({
      firstViewedOn,
    })

  const data = await getResultByResultId(auth, resultId)

  return data
}

function getBaseQueryForResults() {
  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('ResultSource as rso', 'r.resultSourceId', 'rso.id')
    .leftJoin('PartnerAssay as pa', function() {
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
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('ResultStatusLog as rslog', 'r.resultStatusLogId', 'rslog.id')
    .leftJoin('Person as ptr', 'rslog.createdBy', 'ptr.userId')
    .leftJoin('Case as ca', 'ca.id', 'r.caseId')

  return resultQuery
}

function getQueryForResultsListAndExport(query, dataConstraints) {
  const resultQuery = getBaseQueryForResults()
    .leftJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rca2', function() {
      this.on('r.assayId', 'rca2.assayId').andOn(
        'r.resultCategory2',
        'rca2.resultCategoryId'
      )
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      resultCategory2Id: 'r.resultCategory2',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'si.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      errorCode: 'r.errorCode',
      workflowStatusId: 'rs.id',
      treatmentStatusId: 'rts.id',
      caseId: 'r.caseId',
      diseaseId: 'dis.id',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder.where(builder =>
          builder
            .whereRaw(
              'LOWER(JSON_EXTRACT(r.patientData, "$.id")) like LOWER(JSON_QUOTE(?))',
              [`%${params.patientOrResearchId}%`]
            )
            .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
        )
      }
    }, query)
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      deviceType: 'dt',
      sample: 'sp',
      geography: 'g',
      result: 'r',
      country: 'c',
      disease: 'dis',
    })

  return resultQuery
}

async function getResultsForReport(auth, query) {
  // for now call existing function, but later add here a query with different aggregations
  return getListResults(query, auth, REPORT_COMMON_FIELDS)
}

async function clinicalIndicatorAggregations(request) {
  const { auth, query } = request

  if (!canViewResults(auth)) {
    throw Boom.unauthorized('You do not have access to results')
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      site: 's',
      geography: 'g',
      result: 'r',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      partnerId: 'g.partnerId',
      siteName: 's.name',
      deviceName: 'd.name',
    })
    .modify(qb => {
      if (query.minDate) {
        qb.where('r.endedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.endedOn', '<=', query.maxDate)
      }
      if (assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('rca.reportable', true)
    .orderBy('r.endedOn')
    .count('r.id as cnt')

  // if no group is specified, use result category
  let groupBy = null
  if (!query.groupBy) {
    groupBy = ['resultCategory1']
  } else if (!Array.isArray(query.groupBy)) {
    groupBy = [query.groupBy]
  } else {
    groupBy = query.groupBy
  }

  // handle possible groups:
  const paramToDb = {
    resultCategory1: 'rc1.externalId as resultCategory1',
    resultCategory2: 'rc2.externalId as resultCategory2',
    week: knex.raw('DATE_FORMAT(r.endedOn, "%x-%v") as week'),
    month: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m") as month'),
    year: knex.raw('DATE_FORMAT(r.endedOn, "%Y") as year'),
    day: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m-%d") as day'),
    gender: knex.raw(
      'replace(r.patientData ->> "$.gender", "null", null) as gender'
    ),
    age: knex.raw('replace(r.patientData ->> "$.age", "null", null) as age'),
    state: 'st.name as state',
  }

  groupBy.forEach(g => {
    resultQuery.modify(qb => {
      qb.select(paramToDb[g])
      qb.groupBy(g)
      qb.orderBy(g)
    })
  })
  return {
    data: await resultQuery,
  }
}

function queryResultFollowUpLastItems(followUpType) {
  const rfuLastIds = knex('ResultFollowUp as _rfu')
    .innerJoin('FollowUp as _fu', '_rfu.followUpId', '_fu.id')
    .innerJoin('FollowUpType as _fut', '_fu.followUpTypeId', '_fut.id')
    .select(['_rfu.resultId', knex.raw('MAX(_rfu.id) as _id')])
    .where('_fut.externalId', followUpType)
    .groupBy('_rfu.resultId')

  return rfuLastIds
}

async function followUpAggregations(request) {
  const { auth, query } = request

  if (!canViewResults(auth)) {
    throw Boom.unauthorized('You do not have access to results')
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  // get followUpType from query, or set it to 1st item ('treatment') from followUpTypes
  const followUpTypes = (await knex('FollowUpType').select('externalId')).map(
    x => x.externalId
  )
  const [treatmentFollowUpType] = followUpTypes
  let followUpType = query.followUpType || treatmentFollowUpType
  if (!followUpTypes.includes(query.followUpType)) {
    followUpType = treatmentFollowUpType
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'st.id', 'g.stateId')
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rсa2', function() {
      this.on('r.assayId', 'rсa2.assayId').andOn(
        'r.resultCategory2',
        'rсa2.resultCategoryId'
      )
    })
    .leftJoin(
      queryResultFollowUpLastItems(followUpType).as('_rfu'),
      'r.id',
      '_rfu.resultId'
    )
    .leftJoin(`ResultFollowUp as rfu`, `_rfu._id`, `rfu.id`)
    .leftJoin(`FollowUp as fu`, `rfu.followUpId`, `fu.id`)
    .leftJoin('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      site: 's',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      deviceName: 'd.name',
      partnerId: 'g.partnerId',
      siteName: 's.name',
    })
    .modify(qb => {
      if (assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.followUp) {
        qb.where(`fu.externalId`, '=', query.followUp)
      }
      if (query.minDate) {
        qb.where('r.endedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.endedOn', '<=', query.maxDate)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('rca.reportable', true)
    .where(`fut.externalId`, '=', followUpType)
    .orderBy('r.endedOn')
    .count('r.id as cnt')

  // if no group is specified, use followUp
  let groupBy = null
  if (!query.groupBy) {
    groupBy = ['followUp']
  } else if (!Array.isArray(query.groupBy)) {
    groupBy = [query.groupBy]
  } else {
    groupBy = query.groupBy
  }
  // group also by 'followUp' if missed
  if (!groupBy.includes('followUp')) {
    groupBy.push('followUp')
  }

  // handle possible groups:
  const paramToDb = {
    resultCategory1: 'rc1.externalId as resultCategory1',
    resultCategory2: 'rc2.externalId as resultCategory2',
    week: knex.raw('DATE_FORMAT(r.endedOn, "%x-%v") as week'),
    month: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m") as month'),
    year: knex.raw('DATE_FORMAT(r.endedOn, "%Y") as year'),
    day: knex.raw('DATE_FORMAT(r.endedOn, "%Y-%m-%d") as day'),
    gender: knex.raw(
      'replace(r.patientData ->> "$.gender", "null", null) as gender'
    ),
    age: knex.raw('replace(r.patientData ->> "$.age", "null", null) as age'),
    state: 'st.name as state',
    followUp: `fu.externalId as followUp`,
  }

  groupBy.forEach(g => {
    resultQuery.modify(qb => {
      qb.select(paramToDb[g])
      qb.groupBy(g)
      qb.orderBy(g)
    })
  })
  return {
    data: await resultQuery,
  }
}

async function createResult(request) {
  return updateOrCreateResult(request)
}

async function updateResult(request) {
  const {
    params: { resultId },
    auth,
    payload,
  } = request

  const result = await getResultByResultId(auth, resultId, [
    'r.id',
    'r.siteId',
    'r.assayId',
    'r.deviceId',
    'r.sampleId',
    'r.partnerId',
    'r.resultCategory1',
    'r.resultCategory2',
    'r.endedOn',
    'rso.externalId as resultSourceExternalId',
  ])
  if (!result.ok) {
    return Boom.notFound(
      'This result does not exist or you do not have access.'
    )
  }

  if (result.data.resultSourceExternalId !== 'EnteredByHand') {
    // The end-datetime can't be changed if the assay was not entered by hand and should be disabled in the UI anyway.
    // To avoid timezone/clock issues when updating a result, override the date to the one we have in the database.
    payload.endedOn = result.data.endedOn
    if (
      payload.resultCategory1 !== result.data.resultCategory1 ||
      (payload.resultCategory2 || null) !==
        (result.data.resultCategory2 || null)
    )
      return Boom.badRequest(
        'You cannot change the result of an assay that was reported by a device.'
      )
  }

  return updateOrCreateResult(
    request,
    _.pick(result.data, [
      'id',
      'siteId',
      'assayId',
      'deviceId',
      'sampleId',
      'partnerId',
    ])
  )
}

async function updateOrCreateResult(request, result = {}) {
  const {
    auth,
    payload,
    plugins: { messageContext },
  } = request
  const { id: userId, partnerId } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const updating = result.id
  const now = new Date()

  // check that user has access to site
  const site = await getSite(payload.siteId || result.siteId, dataConstraints)
  if (_.isEmpty(site)) {
    return Boom.notFound('This site does not exist or you do not have access.')
  }

  // check that user has access to the assay
  const [assay] = await getAllAssaySchemas(
    partnerId,
    userId,
    payload.assayId || result.assayId
  )
  if (_.isEmpty(assay)) {
    return Boom.notFound('This assay does not exist or you do not have access.')
  }

  // is the selected category valid for the assay?
  const validCategories = _.map(await getAssayResultCategories(assay.id), 'id')
  if (
    validCategories.indexOf(payload.resultCategory1) === -1 ||
    (payload.resultCategory2 &&
      validCategories.indexOf(payload.resultCategory2) === -1)
  ) {
    return Boom.badRequest('The selected result is not valid for this assay.')
  }

  // deviceId is optional. if null and creating a result, it has to be an assay that is for manual entry only
  let { deviceId } = result
  if (!updating) {
    deviceId = await getDeviceIdForResultCreation(
      payload,
      partnerId,
      assay.externalId
    )
  }
  // check that user has access to device
  const device = await getDeviceByDeviceId({
    deviceId,
    credentials: auth.credentials,
  })

  if (!device) {
    return Boom.notFound(
      'This device does not exist or you do not have access.'
    )
  }

  if (!device.hasResults) {
    return Boom.badRequest(
      'This device does not generate results. Make sure that you have selected the correct device.'
    )
  }

  // we can start filling in the result details now
  if (!updating) {
    result.assayId = assay.id
    result.partnerId = partnerId
    result.siteId = site.id
    result.geographyId = site.geographyId
    result.deviceId = device.id
    result.longitude = site.longitude
    result.latitude = site.latitude
    result.resultSourceId = await resultSourceToId('EnteredByHand')
    result.resultTypeId = await resultTypeToId('Patient')
    result.createdOn = now
    result.createdBy = userId
    result.resultData = '{}'
  }

  result.resultCategory1 = payload.resultCategory1
  result.resultCategory2 = payload.resultCategory2
  result.startedOn = payload.endedOn
  result.endedOn = payload.endedOn
  result.updatedOn = now
  result.updatedBy = userId
  result.reportableSiteId =
    payload.sampleOriginSiteId || device.defaultReportableSiteId || site.id

  // create sample-entry or update it
  result.sampleId = await updateOrCreateSample(
    result.sampleId,
    payload.sampleId,
    payload.sampleTypeId,
    payload.sampleCollectedOn,
    payload.sampleOriginSiteId
  )

  // create case entry or update it
  if (payload.caseId && assay.diseaseId) {
    result.caseId = await getCaseId(
      { externalId: payload.caseId, partnerId, diseaseId: assay.diseaseId },
      true,
      userId
    )
  } else {
    result.caseId = null
  }

  // looks like all's well. create or update result now so we have a result id for tags, form data, etc.
  // TODO: Log any changes (see ASP-1371)
  if (updating) {
    await knex('Result')
      .update(result)
      .where('id', result.id)
  } else {
    ;[result.id] = await knex('Result').insert(result)
  }

  // update or insert tags
  await updateTagsById(result.id, 'result', payload.tags, auth)

  // update result form data
  await updateFormDataByResultId(
    result.id,
    result.partnerId,
    result.assayId,
    result.formData,
    payload.formData,
    auth,
    messageContext,
    getRemoteAddress(request)
  )

  // update/insert workflow status
  const resultWorkflowStatusExternalId =
    result.resultCategory1 === (await resultCategoryToId('Error'))
      ? 'Error'
      : 'Deliverable'

  const resultWorkflowLogEntry = {
    resultId: result.id,
    createdBy: userId,
    operator: null,
    reason: 'Manual Result Entry',
    changedOn: now,
    createdOn: now,
  }
  await updateResultWorkflowStatusByResultId(
    knex,
    resultWorkflowLogEntry,
    resultWorkflowStatusExternalId,
    null,
    result.resultWorkflowStatusId,
    result.resultWorkflowChangedOn
  )

  // insert treatment status (can't be changed manually, so only do on insert)
  if (!updating) {
    const resultTreatmentStatusId = await resultTreatmentStatusToId(
      'AwaitingTreatment'
    )
    await updateTreatmentStatusByResultId(
      userId,
      result.id,
      null,
      null,
      resultTreatmentStatusId,
      null,
      'Manual Result Entry',
      now
    )
  }

  const r = await getResultByResultId(auth, result.id)
  return r
}

async function getDeviceIdForResultCreation(
  payload,
  partnerId,
  assayExternalId
) {
  if (payload.deviceId) {
    return payload.deviceId
  }
  // TODO: configure this in the db instead of hardcoding
  const assaysForManualEntry = [
    'assayGenericCovid19',
    'GenericRDT',
    'DaktariHivVL',
  ]
  if (assaysForManualEntry.indexOf(assayExternalId) === -1) {
    throw Boom.badRequest(
      'You did not select a device and this assay can not be entered manually without a device. Please specify a device.'
    )
  }
  const aspectDeviceId = await getAspectDeviceId(partnerId)
  if (!aspectDeviceId) {
    throw Boom.internal(
      'Could not find Aspect device for assigning this result.'
    )
  }
  return aspectDeviceId
}

async function updateOrCreateSample(
  sampleId,
  externalId,
  sampleTypeId,
  collectedOn,
  originSiteId
) {
  let sampleData = {
    externalId,
    collectedOn,
    sampleTypeId,
    originSiteId,
  }

  if (sampleId) {
    // remove undefined (= not part of the POST fields) for updating
    sampleData = _.omitBy(sampleData, _.isUndefined)
    if (!_.isEmpty(sampleData)) {
      await knex('Sample')
        .update(sampleData)
        .where({ id: sampleId })
    }
    return sampleId
  }
  return [await knex('Sample').insert(sampleData)]
}

module.exports = {
  updateTransferNotification,
  listResults,
  getResultsForReport,
  exportResults,
  downloadResultsList,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateTreatmentStatusPost,
  listTreatmentStatusTypes,
  updateFormData,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
  createUniqueIdForResult,
  confirmedTreatmentTracking,
  listFollowUps,
  setResultFollowUp,
  updateResultFollowUp,
  deleteResultFollowUp,
  addResultNote,
  deleteResultNote,
  allResultNotes,
  showResultFollowUps,
  transferResult,
  clinicalIndicatorAggregations,
  followUpAggregations,
  getQueryForResultsListAndExport,
  queryResultFollowUpLastItems,
  getListResults,
  createResult,
  updateResult,
  addPartnerQueryConstraints,
  getResultForStringTemplateProcessing,
}
