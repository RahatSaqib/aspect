const { startOfToday, addDays, format } = require('date-fns')
const { Promise } = require('bluebird')
const { getArrayOfDaysInRange } = require('../shared/date')
const { knex, filterDateRangeParams } = require('../db')
const formDictionary = require('../forms/formsFileDictionary')

/**
 * Clean and fills FactCustomFieldCompletion table with stats for last 30 days
 */
const factFillCustomFieldsCompletionStatsLast30Days = async () =>
  factFillCustomFieldsCompletionStats(
    format(addDays(startOfToday(), -30), 'yyyy-MM-dd'),
    format(startOfToday(), 'yyyy-MM-dd')
  )

/**
 * Clean and fills FactCustomFieldCompletion table with stats for the specified date range
 * @param {*} dateFrom - date from
 * @param {*} dateTo - date to
 * @returns Quantity of rows inserted
 */
async function factFillCustomFieldsCompletionStats(dateFrom, dateTo) {
  let insertedStats = 0
  const days = getArrayOfDaysInRange(dateFrom, dateTo)

  const definitions = await getCustomFieldsDefinitions()

  const selectColumnClauses =
    convertCustomFieldsToColumnKnexClauses(definitions)

  const allFields = definitions.map(d => d.fields).flat()

  await knex.raw(
    'delete from FactCustomFieldCompletion where date >= ?',
    dateFrom
  )

  await Promise.map(
    days,
    async day =>
      getResultsCustomFields(selectColumnClauses, day, addDays(day, 1)).then(
        async r => {
          const stats = generateStatsResult(allFields, r)
          if (stats.length > 0) {
            await knex('FactCustomFieldCompletion').insert(stats)
          }
          insertedStats += stats.length
        }
      ),
    { concurrency: 10 }
  )
  return insertedStats
}

/**
 * Converts the custom fields definitions in all the form definitions provided, to a list of knex clauses
 * @param {*} formDefinitions - Array of form definitions
 */
function convertCustomFieldsToColumnKnexClauses(formDefinitions) {
  return formDefinitions
    .map(fd =>
      fd.fields.map(customField => ({
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

/**
 * Retrieve specified custom fields from Results
 * @param {*} customFieldsClauses - knex select clauses for each custom field
 * @param {*} dateFrom - date From
 * @param {*} dateTo - date to
 * @returns Result set with a column for each custom field, and rows for each site, assay and date
 */
async function getResultsCustomFields(customFieldsClauses, dateFrom, dateTo) {
  const data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(
      filterDateRangeParams,
      { minDate: dateFrom, maxDate: dateTo },
      'r.endedOn'
    )
    .where('s.disabled', 0)
    .groupBy('s.id', 'a.id', knex.raw('DATE(r.endedOn)'))
    .select(
      's.id as siteId',
      's.name as siteName',
      'a.id as assayId',
      'at.diseaseId',
      knex.raw('DATE(r.endedOn) as date')
    )
    .count('* as recordCount')
    .select(...customFieldsClauses.map(cf => cf.clause))
    .orderBy('s.name')
  return data
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
    fields: formDictionary[qf.jsonSchemaFileName].fields
      .filter(f => f.completionWeight && f.payloadDestinationPath)
      .map(field => ({
        id: field.id,
        assayId: qf.assayId,
        diseaseId: qf.diseaseId,
        name: field.name,
        completionWeight: field.completionWeight || 0,
        payloadDestinationPath: field.payloadDestinationPath,
        fieldName: normalizeCustomFieldName(field),
      })),
  }))
}

/**
 * Converts the grouped results to a list of stats objects
 * @param {*} fields - List of custom fields
 * @param {*} res - List of results grouped by site/assay/date
 * @returns List of stats objects, ready to be persisted in the FactCustomFieldCompletion table
 */
function generateStatsResult(fields, res) {
  const stats = res
    .map(r => {
      let completionRate = 0
      const currentFields = fields.filter(f => {
        return (
          f.assayId === r.assayId || (!f.assayId && f.diseaseId === r.diseaseId)
        )
      })
      const statsRow = {
        siteId: r.siteId,
        assayId: r.assayId,
        date: r.date,
        completionByField: Object.fromEntries(
          currentFields.map(f => {
            const completionCount = r[f.fieldName]

            const totalWeight = fields.reduce((acc, cur) => {
              if (cur.assayId === r.assayId || cur.diseaseId === r.diseaseId) {
                acc += cur.completionWeight
              }
              return acc
            }, 0)
            // completion weighting for current field
            // * is expressed as coefficient (i.e. 0.5 = 50% completion)
            // * all values references this date/site/assay combination:
            // (100 / record count) * (completion count / total weight) * completion weight / 100
            const fieldWeighting =
              ((100 / r.recordCount) *
                (completionCount / totalWeight) *
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
        updatedOn: new Date(),
      }
      return statsRow
    })
    .filter(stat => Object.keys(stat.completionByField).length > 0)
  return stats
}

function getMySqlJsonPathFromCustomField(customField) {
  if (customField.payloadDestinationPath?.startsWith('data')) {
    return `r.resultData ->> '$.${customField.fieldName}'`
  }
  return `r.patientData ->> '$.${customField.fieldName}'`
}

/**
 * Determine the name of the custom field
 * @param {string} - Custom field definition from the form json definition
 * @returns if the field has payloadDestinationPath, extracts the name, if not returns the field name with lower capitalization
 */
const normalizeCustomFieldName = field => {
  if (field.payloadDestinationPath) {
    return field.payloadDestinationPath.split('.')[1]
  }
}

module.exports = {
  factFillCustomFieldsCompletionStats,
  factFillCustomFieldsCompletionStatsLast30Days,
}
