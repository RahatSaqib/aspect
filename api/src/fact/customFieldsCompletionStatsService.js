const {
  knex,
  filterDateRangeParams,
  filterParams,
  sortPageParams,
} = require('../db')
// const { getCustomFields } = require('../forms/service')
const formDictionary = require('../forms/formsFileDictionary')
const {
  getMappingFieldName,
} = require('../result/serviceReportVietnam/geneXpertM4B1PatientsReport')

async function getCustomFieldsCompletionStats() {
  const definitions = await getCustomFieldsDefinitions()

  const selectColumnClauses =
    convertCustomFieldsToColumnKnexClauses(definitions)

  const res = await getCustomFieldsFromResults(
    selectColumnClauses,
    '2022-02-01',
    '2022-02-02'
  )

  const fields = definitions.map(d => d.fields).flat()
  const result = convertToJson(fields, res)
  return result
  // console.log(res)
}

function convertToJson(fields, res) {
  return res.map(r => {
    return {
      siteId: r.siteId,
      assayId: r.assayId,
      date: r.date,
      completionRate: '',
      completionByField: Object.fromEntries(
        fields.map(f => [[`${f.fieldName}`], r[f.fieldName]])
      ),
      recordCount: '',
    }
  })
}

/**
 * Queries applicable forms from DB and returns the form definitions extracted from the forms JSON files
 * @returns {Object} Containing the form definitions
 */
async function getCustomFieldsDefinitions() {
  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .join(
      'FormDefinitionSchema as fschema',
      'fd.formDefinitionSchemaId',
      'fschema.id'
    )
    .innerJoin('Disease as d', 'fd.diseaseId', 'd.id')
    .where('fd.partnerId', 1)
    .where('ft.externalId', 'gxConnectForm')
    // .where('d.externalId', 'tb') // <-- includes MTB and MTB-Ultra
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw(
        "REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName"
      )
    )

  return queryForm.map(qf => ({
    file: qf.jsonSchemaFileName,
    assayId: qf.assayId,
    diseaseId: qf.diseaseId,
    formTypeId: qf.assayId,
    fields: formDictionary[qf.jsonSchemaFileName].fields.map(field => ({
      id: field.id,
      name: field.name,
      gxAlertDbColumn: field.gxAlertDbColumn,
      completionWeight: field.completionWeight || 0,
      payloadDestinationPath: field.payloadDestinationPath,
      fieldName: normalizeCustomFieldName(
        field.payloadDestinationPath
          ? field.payloadDestinationPath.split('.')[1]
          : field.name
      ),
    })),
  }))
}

/**
 * Converts the custom fields definitions in all the form definitions provided, to a list of knex clauses
 * @param {*} formDefinitions - Array of form definitions
 */
function convertCustomFieldsToColumnKnexClauses(formDefinitions) {
  return formDefinitions
    .map(fd =>
      fd.fields.map(customField => ({
        // id: customField.id,
        // form: fd.file,
        fieldName: customField.fieldName,
        clause: knex.raw(
          `SUM(CASE WHEN IFNULL(${getMySqlJsonPathFromCustomField(
            customField
          )},'') IN ('', 'null') THEN 0 ELSE 1 END) AS '${
            customField.fieldName
          }'`
        ),
      }))
    )
    .flat() // flatten fields from all forms
    .filter(
      // Unique clauses
      (value, index, array) =>
        array.findIndex(
          v => v.clause.toString() === value.clause.toString()
        ) === index
    )
}

function getMySqlJsonPathFromCustomField(customField) {
  if (customField.payloadDestinationPath?.startsWith('data')) {
    return `r.resultData ->> '$.${customField.fieldName}'`
  }
  return `r.patientData ->> '$.${customField.fieldName}'`
}

const normalizeCustomFieldName = customFieldName => {
  return (
    customFieldName.replace(/\s/g, '').charAt(0).toUpperCase() +
    customFieldName.slice(1)
  )
}

async function getCustomFieldsFromResults(
  customFieldsClauses,
  dateFrom,
  dateTo
) {
  // console.log(
  //   '\x1b[1;34m',
  //   '🚀  ➜ file: customFieldsCompletionStatsService.js ➜ line 168 ➜ getCustomFieldsFromResults ➜ customFields.map(cf => cf.clause)',
  //   customFieldsClauses
  // )
  const data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    // .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    // .modify(addConstraints, dataConstraints, {
    //   device: 'd',
    //   site: 's',
    //   geography: 'g',
    //   assay: 'a',
    //   result: 'r',
    // })
    .modify(
      filterDateRangeParams,
      { minDate: dateFrom, maxDate: dateTo },
      'r.endedOn'
    )
    // .modify(filterParams, query, {
    //   // query
    //   countryId: 'g.countryId',
    //   stateId: 'g.stateId',
    //   lgaId: 'g.lgaId',
    //   siteName: 's.name',
    // })
    .groupBy('s.id', 'a.id', knex.raw('DATE(r.endedOn)'))
    .select(
      's.id as siteId',
      's.name as siteName',
      'a.id as assayId',
      knex.raw('DATE(r.endedOn) as date')
    )
    .count('* as total')
    .select(...customFieldsClauses.map(cf => cf.clause))
    .orderBy('s.name')
  return data
}

module.exports = {
  customFieldsCompletionStatsService: getCustomFieldsCompletionStats,
}
