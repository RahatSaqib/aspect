const Boom = require('boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')

const startOfMonth = require('date-fns/start_of_month')
const endOfMonth = require('date-fns/end_of_month')
const subMonths = require('date-fns/sub_months')
const startOfQuarter = require('date-fns/start_of_quarter')
const endOfQuarter = require('date-fns/end_of_quarter')
const subQuarters = require('date-fns/sub_quarters')
const startOfYear = require('date-fns/start_of_year')

const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { resultUpdated } = require('./actions')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  getCellsByValue,
  generateExcelFile,
  generateCsvFile,
} = require('../shared/io')
const { resultWorkflowStatusToId } = require('../shared/dictionary')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const { getPathFromFileReferenceId } = require('../file/service')
const { resultDataCategoryLow } = require('../result/actions')

const SELECT_LIST_FIELDS = [
  'r.id',
  'r.externalId',
  'r.endedOn',
  'd.name as deviceName',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.name as resultWorkflowStatus',
  'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.collectedOn as sampleCollectedOn',
  'a.name as assayName',
  'a.id as assayId',
  'r.deviceId',
  'stp.name as sampleTypeName',
  knex.raw(
    'JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")) as resultText'
  ),
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
]

const SELECT_SHOW_FIELDS = [
  'r.id',
  'r.externalId',
  'r.startedOn',
  'r.endedOn',
  'r.deviceId',
  'd.name as deviceName',
  'd.serial as deviceSerial',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'r.resultWorkflowStatusId',
  'rs.name as resultWorkflowStatus',
  'rs.externalId as resultWorkflowStatusExternalId',
  'r.resultData',
  'r.formData',
  'r.siteId',
  'si.name as siteName',
  'r.assayVersion',
  'r.consumableSerial',
  'r.consumableLot',
  'r.consumableExpirationDate',
  'r.instrumentSerial',
  'r.moduleName',
  'r.moduleSerial',
  'r.researchId',
  'r.senderVersion',
  'r.senderOperator',
  'r.notes',
  'r.errorCode',
  'r.errorNotes',
  'r.createdOn',
  'r.updatedOn',
  'r.assayId',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.originSiteId as sampleOriginSiteId',
  'sp.collectedOn as sampleCollectedOn',
  'so.name as sampleOriginSiteName',
  'stp.name as sampleTypeName',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  'r.patientData',
  'r.qcCheck',
  'rf.formSchema',
]

const SORT_FIELDS = [
  'endedOn',
  'deviceName',
  'sampleOriginSiteName',
  'stateName',
  'lgaName',
  'sampleId',
  'sampleGroup',
  'resultText',
  'resultWorkflowStatus',
  'resultCategory1Name',
  'resultCategory2Name',
  'patientId',
]
async function getListResults(query, auth) {
  const selectFields = _.clone(SELECT_LIST_FIELDS)
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

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultSource as rsrc', 'r.resultSourceId', 'rsrc.id')
    .leftJoin('Site as sr', 'r.siteId', 'sr.id')
    // Filter Generated results for now until we come up with appropriate UI
    .where('rsrc.externalId', '<>', 'Generated')
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'sr.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      sampleGroup: 'r.sampleGroup',
      workflowStatusId: 'r.resultWorkflowStatusId',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder
          .whereRaw('JSON_EXTRACT(r.patientData, "$.id") like ?', [
            `%${params.patientOrResearchId}%`,
          ])
          .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
      }
    }, query)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })

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

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

async function showResult(request) {
  const result = await getResultByResultId(request)
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
      'dl.checkpoint as checkPoint',
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
  const { params: { resultId }, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReferences = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where('rf.resultId', resultId)
    .orderBy('f.id', 'asc')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(
      'f.id',
      'f.name',
      'f.length',
      'f.createdOn',
      'fct.externalId as fileContentType',
      'fct.mimeType',
      'fct.mimeSubtype'
    )
    .map(ref => {
      ref.url = `/result/file/${resultId}/${ref.id}/${ref.name}`
      return ref
    })
  return { data: fileReferences }
}

function downloadFile(request, reply) {
  return downloadFileAsync(request)
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      reply(err)
    })
}

function downloadFirstImage(request, reply) {
  const { auth, params: { resultId } } = request
  return downloadFileAsync({ auth, params: { resultId, mimeType: 'image' } })
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      reply(err)
    })
}

async function downloadFileAsync({ auth, params }) {
  const { resultId, fileReferenceId, fileName, mimeType } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReference = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { device: 'd' })
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

async function getResultByResultId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const results = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultForm as rf', function() {
      this.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .where('r.id', +params.resultId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
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
        .where('a.id', data.assayId)
        .first()
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferences(request)
    data.files = files
  }

  return { ok: results.length === 1, data }
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

// ---------------------------------
// exporting Results data
// ---------------------------------
async function exportResults(request) {
  const { query, auth } = request

  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // do not export more than 100.000 records
  query.size = 1e5

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  const results = await getListResults(query, auth)

  let result = null

  if (query.format === 'excel') {
    // fill in data into given workbook
    const populateData = workbook => {
      // get 1st sheet (1-based)
      const worksheet = workbook.getWorksheet(1)

      // locate cell(s) with needed value
      const cells = getCellsByValue(worksheet, '<ResultListRows>')
      if (cells.length > 0) {
        // empty such cells
        cells.forEach(cell => {
          cell.value = ''
        })

        // use 1st cell only (actually, should not be more than one)
        const patternRowNumber = cells[0].row + 2

        // fill in array 'rows'
        const rows = []
        results.data.forEach(r => {
          // ------
          // --->>> order of array elements should match columns order in template file
          // ------
          rows.push([
            r.endedOn,
            r.deviceName,
            r.sampleOriginSiteName,
            r.sampleId,
            r.sampleGroup,
            r.patientId,
          ])
        })

        // insert rows from patternRowNumber, and remove row number 'patternRowNumber'
        worksheet.spliceRows(patternRowNumber, 1, ...rows)
      }
    }

    result = await generateExcelFile({
      templateFileName: 'Results.xlsx',
      outputFileName: 'results.xlsx',
      populateData,
    })
  } else if (query.format === 'csv') {
    const items = results.data
    const columnNames = [
      'Test Date',
      'Device',
      'Sample Origin Site',
      'Sample ID',
      'Sample Group',
      'Patient ID',
    ]
    const fieldNames = [
      'endedOn',
      'deviceName',
      'sampleOriginSiteName',
      'sampleId',
      'sampleGroup',
      'patientId',
    ]
    result = await generateCsvFile(
      'results.csv',
      items,
      columnNames,
      fieldNames
    )
  }

  return result
}

async function updateWorkflowStatus(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    Boom.notFound()
  }

  let { resultWorkflowStatusId } = payload
  // check if a externalId is provided
  if (payload.externalId) {
    resultWorkflowStatusId = await resultWorkflowStatusToId(payload.externalId)
    if (!resultWorkflowStatusId) {
      return Boom.badRequest('Invalid ResultWorkflowStatus ID')
    }
  }

  // update the resultWorkflowStatusId.
  if (resultWorkflowStatusId !== result.data.resultWorkflowStatusId) {
    await knex('Result')
      .where('id', resultId)
      .update({
        resultWorkflowStatusId,
        updatedBy: currentUserId,
        updatedOn: now,
      })

    await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      createdBy: currentUserId,
      changedOn: now,
      createdOn: now,
    })
  }

  const response = await showResult(request)
  return response
}

async function updateQcCheck(request) {
  const { auth, params, payload, plugins: { messageContext } } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and workflow status
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  if (result.data.resultWorkflowStatusExternalId !== 'Deliverable') {
    return Boom.badRequest(
      '"QC Check" can only be set for results that are in the workflow status "Ready for Delivery".'
    )
  }

  // update the result QC Check flag
  messageContext.bindActionCreators({
    resultUpdated,
  })
  await messageContext.transact(async knex => {
    await knex('Result')
      .where('id', resultId)
      .update({
        qcCheck: payload.qcCheck,
        updatedBy: currentUserId,
        updatedOn: now,
      })

    // log QC-Check change in separate table
    await knex('ResultQualityControlLog').insert({
      resultId,
      qcCheck: payload.qcCheck,
      createdBy: currentUserId,
      createdOn: now,
    })

    // notify result updated so result is redelivered
    messageContext.resultUpdated(resultId)
  })

  const response = await showResult(request)
  return response
}

async function updateFormData(request) {
  const { auth, params, payload, plugins: { messageContext } } = request
  const now = new Date()
  const { resultId } = params

  const result = await getResultByResultId(request, [
    'r.assayId',
    'r.partnerId',
    'r.formData',
  ])
  if (!result.ok) {
    return Boom.notFound()
  }
  const existingFormData = _.get(result, 'formData', {})
  const mergedFormData = _.merge({}, existingFormData, payload)
  if (!_.isEqual(existingFormData, mergedFormData)) {
    const resultForm = await knex('ResultForm')
      .where({
        partnerId: result.data.partnerId,
        assayId: result.data.assayId,
      })
      .first('formSchema')

    if (!resultForm || _.isEmpty(resultForm.formSchema)) {
      return Boom.badRequest(
        'This result cannot accept form data because no form schema is defined.'
      )
    }
    const formSchema = JSON.parse(resultForm.formSchema)
    const unrecognisedFields = _.difference(
      Object.keys(payload),
      Object.keys(formSchema)
    )
    if (!_.isEmpty(unrecognisedFields)) {
      const undefinedFieldMessage =
        unrecognisedFields.length > 1
          ? `This result cannot accept the following fields in it's form data: [${unrecognisedFields.join()}] because they are not defined in the forms schema.`
          : `This result cannot accept the following field in it's form data: ${
              unrecognisedFields[0]
            } because it is not defined in the forms schema.`
      return Boom.badRequest(undefinedFieldMessage)
    }
    const fieldValidationErrors = []
    _.each(Object.keys(payload), formFieldKey => {
      const formFieldValue = _.get(payload, formFieldKey)
      const formFieldSchema = _.get(formSchema, formFieldKey)
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
                  ? `${
                      illegalValuesEntered[0]
                    } is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
                  : `[${illegalValuesEntered.join()}] are invalid for ${formFieldKey} because they are not present in the options configured for the field.`
              fieldValidationErrors.push(validationMessage)
            }
          } else if (!allowedValues.includes(formFieldValue)) {
            fieldValidationErrors.push(
              `${formFieldValue} is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
            )
          }
        }
      }
    })
    if (!_.isEmpty(fieldValidationErrors)) {
      return Boom.badRequest(fieldValidationErrors.join('\n'))
    }
    messageContext.bindActionCreators({
      resultUpdated,
    })
    const { id: currentUserId } = await getUser(auth.credentials.name)
    await messageContext.transact(async knex => {
      await knex('Result')
        .where('id', resultId)
        .update({
          formData: JSON.stringify(mergedFormData),
          updatedBy: currentUserId,
          updatedOn: now,
        })
      messageContext.resultUpdated(resultId)
    })
  }
  const response = await showResult(request)
  return response
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
    .where('log.resultId', +params.resultId)

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

async function checkDataCategoriesForLowStatus(action, { messageContext }) {
  const context = messageContext.bindActionCreators({
    resultDataCategoryLow,
  })

  const now = new Date()
  const addPeriod = (name, dateFrom, dateTo) => ({ name, dateFrom, dateTo })
  const periods = [
    addPeriod('Current Month', startOfMonth(now), now),
    addPeriod(
      'Last Month',
      startOfMonth(subMonths(now, 1)),
      endOfMonth(subMonths(now, 1))
    ),
    addPeriod('Current Quarter', startOfQuarter(now), now),
    addPeriod(
      'Last Quarter',
      startOfQuarter(subQuarters(now, 1)),
      endOfQuarter(subQuarters(now, 1))
    ),
    addPeriod('This Year', startOfYear(now), now),
  ]

  await context.run(async knex => {
    // read all data categories for all geagraphies
    const dataCategories = await knex('DataCategory')

    // check data categories for having 'low status'
    _.map(dataCategories, async dataCategory => {
      const validValues =
        dataCategory.validValues && JSON.parse(dataCategory.validValues)

      const { partnerId } = dataCategory

      // get all sites for current partnerId
      const sites = await knex('Site')
        .where({ partnerId })
        .select('id', 'name', 'geographyId')

      _.map(periods, period => {
        _.map(sites, site => {
          const itemsBase = knex('Result as r')
            .innerJoin('Device as d', 'r.deviceId', 'd.id')
            // filter by period
            .where('r.endedOn', '>=', period.dateFrom)
            .where('r.endedOn', '<=', period.dateTo)
            // filter by site
            .where(function() {
              // either result is from site's geography
              this.where(function() {
                this.whereNotNull('r.geographyId').andWhere(
                  'r.geographyId',
                  site.geographyId
                )
              })
              // or device is from site's geography
              this.orWhere(function() {
                this.whereNotNull('d.geographyId')
                  .andWhereRaw(`${site.geographyId || -1} > 0`)
                  .andWhere('d.geographyId', site.geographyId)
              })
            })

          const totals = itemsBase.countDistinct('r.id')
          // -------------------------------
          // notice that because patientData is a stringified JSON - all property names and values are quoted, and
          // value has leading space, so pattern is "name": "value"
          // (clarify if it makes sense to distinguish values as string, boolean, date and number here)
          // -------------------------------
          const numValid = itemsBase
            .andWhere(function() {
              // at least make sure field exists in json
              this.where(
                'r.patientData',
                'like',
                `%"${dataCategory.externalId}":%`
              )

              // process 2 main cases - validValues is an array or not
              if (validValues && _.isArray(validValues)) {
                this.where(function() {
                  _.each(validValues, value => {
                    this.orWhere(
                      'r.patientData',
                      'like',
                      `%"${dataCategory.externalId}": "${value}"%`
                    )
                  })
                })
              } else {
                // make sure existing value is not undefined, null, "undefined", "null" or ""
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": undefined%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": null%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": "undefined"%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": "null"%`
                )
                this.whereNot(
                  'r.patientData',
                  'like',
                  `%"${dataCategory.externalId}": ""%`
                )
              }
            })
            .countDistinct('r.id')

          const percentage = totals === 0 ? 0 : 100 * (numValid / totals)
          if (percentage < dataCategory.cutoffPercentage) {
            const payload = {
              dataCategoryId: dataCategory.id,
              categoryName: dataCategory.name,
              periodName: period.name,
              siteId: site.id,
              percentage,
            }
            context.resultDataCategoryLow(payload)
          }
        })
      })
    })
  })
}

module.exports = {
  listResults,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateQcCheck,
  updateFormData,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  exportResults,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
  createUniqueIdForResult,
  checkDataCategoriesForLowStatus,
}
