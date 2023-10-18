const { subDays } = require('date-fns')
const _ = require('lodash')
const flatten = require('flat')
const { getPersonByPersonId } = require('../../auth/service')
const { getResultsForExport } = require('../service')
const { knex } = require('../../db')
const { getAllAssaySchemas } = require('../../assay/service')

module.exports = async (auth, query) => {
  const user = await getPersonByPersonId(auth.credentials.personId)

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // For performance issues we are going to limit this report to max 50k results.
  query.size = query.maxNumberOfRecords || 50000

  // For performance issues this enforce to use the result_partner_endedOn_index Index, because it helps to reduce query time down to  60%
  if (_.isNil(query.minDate)) query.minDate = subDays(new Date(query.maxDate), query.daysToSubstract || 360)

  const { data: resultFromBaseQuery, extraColumns = [], total } = await getResultsForExport(auth, query)

  const resultIds = _.map(resultFromBaseQuery, result => result.id)

  // get follow ups using the resultIds from initial query
  const followUps = await getLatestFollowUpsByResultIds(resultIds)

  // get result workflow log using the resultId from initial query
  const resultWorkflowData = await getLatestResultWorkflowLogByResultIds(resultIds)

  // merge the responses above to the original results
  const data = _.map(resultFromBaseQuery, resultItem => {
    const matchedFollowUp = followUps.find(followUp => followUp.resultId === resultItem.id)

    const matchedWorkflow = resultWorkflowData.find(workflow => workflow.resultId === resultItem.id)

    return {
      ...resultItem,
      ...matchedFollowUp,
      ...matchedWorkflow,
    }
  })

  const { partnerId, id: userId } = user
  const props = { query, partnerId, userId }
  const columnsFromAssaySchema = await getColumnsFromAssaySchema(props)
  const columnsFromResultForms = await getColumnsFromResultForms(props)
  const columns = [
    ..._.map(extraColumns, column => ({
      key: column.db,
      header: column.title,
    })),
    // TODO: move below items to Excel template for better formatting and translations
    { key: 'deviceStateName', header: 'State' },
    { key: 'caseExternalId', header: 'Case ID' },
    { key: 'resultCategoryGroup', header: 'Result' },
    { key: 'resultData.resultText', header: 'Raw Result' },
    { key: 'resultData.allResistances.INH', header: 'INH' },
    { key: 'resultData.allResistances.FLQ', header: 'FLQ' },
    { key: 'resultData.allResistances.AMK', header: 'AMK' },
    { key: 'resultData.allResistances.KAN', header: 'KAN' },
    { key: 'resultData.allResistances.CAP', header: 'CAP' },
    { key: 'resultData.allResistances.ETH', header: 'ETH' },
    { key: 'sampleId', header: 'Sample Id' },
    { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
    { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
    { key: 'resultWorkflowStatus', header: 'Result Status' },
    { key: 'resultTreatmentStatus', header: 'Follow Up Status' },
    { key: 'followUpName', header: 'Follow Up' },
    { key: 'followUpDate', header: 'Follow Up Date' },
    { key: 'followUpComment', header: 'Follow Up Comment' },
    { key: 'recordedInRegister', header: 'Recorded In Register' },
    { key: 'resultWorkflowChangedOn', header: 'Result Status Changed On' },
    { key: 'consumableSerial', header: 'Consumable Serial' },
    { key: 'consumableLot', header: 'Consumable Lot' },
    { key: 'consumableExpirationDate', header: 'Consumable Expiration Date' },
    { key: 'instrumentSerial', header: 'Instrument Serial' },
    { key: 'moduleName', header: 'Module' },
    { key: 'moduleSerial', header: 'Module Serial' },
    { key: 'researchId', header: 'Research ID' },
    { key: 'senderOperator', header: 'Operator' },
    { key: 'errorCode', header: 'Error Code' },
    { key: 'errorNotes', header: 'Error notes' },
    { key: 'notes', header: 'Notes' },
    { key: 'assayName', header: 'Assay' },

    // dynamic columns from different schema json fields
    ...columnsFromAssaySchema,
    ...columnsFromResultForms,
  ]

  const dataset = {
    ok: true,
    total,
    length: _.get(data, 'length', 0),
    data,
    dynamicColumns: columns,
    fixedColumns: [
      { key: 'endedOn', header: 'Test Date' },
      { key: 'stateName', header: 'Sample State' },
      { key: 'siteName', header: 'Sample Site' },
      { key: 'sampleId', header: 'Sample ID' },
      { key: 'deviceName', header: 'Device' },
      { key: 'assayName', header: 'Assay' },
      { key: 'errorCode', header: 'Error Code' },
      { key: 'resultWorkflowStatus', header: 'Workflow Status' },
      { key: 'patientId', header: 'Patient Id' },
    ],
    dataSelector: (
      dataRow // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
    ) =>
      flatten({
        ...dataRow,
        patientData: JSON.parse(dataRow.patientData),
        resultData: JSON.parse(dataRow.resultData),
        formData: JSON.parse(dataRow.formData),
        errorCode: _.replace(dataRow.errorCode || '', /(\r\n|\n|\r)/gm, ''),
        errorNotes: _.replace(dataRow.errorNotes || '', /(\r\n|\n|\r)/gm, ''),
        notes: _.replace(dataRow.notes || '', /(\r\n|\n|\r)/gm, ''),
      }),
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

async function getColumnsFromAssaySchema({ query, partnerId, userId }) {
  const columns = []
  const assaySchema = await getAllAssaySchemas(partnerId, userId, query.assayId)
  let resultData = {}
  let patientData = {}

  assaySchema.forEach(element => {
    if (element.patientDataSchema) {
      patientData = _.merge(patientData, JSON.parse(element.patientDataSchema))
    }
    if (element.resultDataSchema) {
      resultData = _.merge(resultData, JSON.parse(element.resultDataSchema))
    }
  })

  const flattenObjects = {
    ...flatten({ resultData }),
    ...flatten({ patientData }),
  }

  _.forEach(flattenObjects, (value, key) => {
    if (key.toLowerCase().indexOf('title') >= 0) {
      columns.push({
        header: value,
        key: key.replace('.title', '').replace('.properties', ''),
      })
    }
  })

  return columns
}

async function getColumnsFromResultForms({ partnerId }) {
  const columns = []
  const forms = await knex('ResultForm').where('partnerId', partnerId).pluck('formSchema')

  _.forEach(forms, formSchema => {
    _.forEach(JSON.parse(formSchema).fields, (value, key) => {
      if (value && (_.isNil(value.excludeReport) || !value.excludeReport) && value.name) {
        columns.push({
          header: value.name,
          key: key.replace('.title', '').replace('.properties', ''),
        })
      }
    })
  })
  return columns
}

const getLatestFollowUpsByResultIds = async resultIds => {
  const subQuery = knex('ResultFollowUp')
    .select('resultId', 'followUpId', 'date', 'updatedOn')
    .whereIn('resultId', resultIds)
    .andWhere('isDeleted', false)
    .select(knex.raw('ROW_NUMBER() OVER(PARTITION BY resultId ORDER BY updatedOn DESC) AS rowNumber'))

  const result = await knex('FollowUp as fup')
    .select('rf.resultId', 'fup.name as followUpName', 'rf.date as followUpDate')
    .from(subQuery.as('rf'))
    .leftJoin('FollowUp as fup', 'rf.followUpId', 'fup.id')
    .join('FollowUpType as fut', 'fut.id', 'fup.followUpTypeId')
    .where('rf.rowNumber', 1)
    .andWhere('fut.externalId', 'treatment')

  return result
}

const getLatestResultWorkflowLogByResultIds = async resultIds => {
  const subQuery = knex('ResultWorkflowLog')
    .select('resultId', 'resultWorkflowStatusId', 'reason', 'changedOn', 'createdOn')
    .whereIn('resultId', resultIds)
    .select(knex.raw('ROW_NUMBER() OVER(PARTITION BY resultId ORDER BY createdOn DESC) AS rowNumber'))

  const acknowledgedWorkflow = await getWorkflowStatus('acknowledged', subQuery)

  const flaggedWorkflow = await getWorkflowStatus('flagged', subQuery)

  return [...acknowledgedWorkflow, ...flaggedWorkflow]
}

const getWorkflowStatus = async (externalId, subQuery) => {
  let query = knex('ResultWorkflowStatus')
    .select('rwl.resultId', 'rwl.reason as followUpComment')
    .from(subQuery.as('rwl'))
    .leftJoin('ResultWorkflowStatus as rwsInner', 'rwl.resultWorkflowStatusId', 'rwsInner.id')
    .where('rwl.rowNumber', 1)
    .andWhere(builder => {
      builder.where('rwsInner.externalId', externalId)
    })

  if (externalId === 'acknowledged') {
    query = query.select('rwl.changedOn as recordedInRegister')
  }

  return query
}
