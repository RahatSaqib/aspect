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

async function getCustomFieldsCompletionStats(dateFrom, dateTo) {
  const definitions = await getCustomFieldsDefinitions()

  const selectColumnClauses =
    convertCustomFieldsToColumnKnexClauses(definitions)

  const res = await getCustomFieldsFromResults(
    selectColumnClauses,
    dateFrom,
    dateTo
  )

  const fields = definitions.map(d => d.fields).flat()

  const results = generateStatsResult(fields, res)

  await knex('FactCustomFieldCompletion').insert(results)

  return results
}

function generateStatsResult(fields, res) {
  const stats = res.map(r => {
    const totalWeigth = fields.reduce(
      (acc, cur) => acc + cur.completionWeight,
      0
    )
    let completionRate = 0

    const statsRow = {
      siteId: r.siteId,
      assayId: r.assayId,
      date: r.date,

      completionByField: Object.fromEntries(
        fields.map(f => {
          const completionCount = r[f.fieldName]
          // field completion weighting = (100 / recordCount) * (completionCount / totalWeigth) * completionWeight / 100
          const fieldWeighting =
            ((100 / r.recordCount) *
              (completionCount / totalWeigth) *
              f.completionWeight) /
            100
          completionRate += fieldWeighting
          return [
            f.fieldName,
            {
              completed: completionCount,
              weighting: fieldWeighting.toFixed(5),
            },
          ]
        })
      ),
      recordCount: r.recordCount,
      completionRate: completionRate.toFixed(5),
      createdBy: 1,
      updatedBy: 1,
      createdOn: new Date(),
      updatedOn: new Date(),
    }
    return statsRow
  })
  return stats
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
    .count('* as recordCount')
    .select(...customFieldsClauses.map(cf => cf.clause))
    .orderBy('s.name')
  return data
}

module.exports = {
  customFieldsCompletionStatsService: getCustomFieldsCompletionStats,
}
