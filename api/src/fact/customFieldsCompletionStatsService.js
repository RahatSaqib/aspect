const { startOfToday, addDays, format } = require('date-fns')
const _ = require('lodash')
const { getArrayOfDaysInRange, slideDateToTimeZone } = require('../shared/date')
const { knex } = require('../db')
const formDictionary = require('../forms/formsFileDictionary')
const { factCheckCompletionRatePerSite } = require('./actions')
const config = require('../config')

const bulkInsertThreshold = 1000

/**
 * Clean and fills FactCustomFieldCompletion table with stats for last 30 days
 */
const factFillCustomFieldsCompletionStatsLast30Days = async (_, { messageContext }) => {
  const context = messageContext.bindActionCreators({
    factCheckCompletionRatePerSite,
  })
  await context.run(async () => {
    await factFillCustomFieldsCompletionStats(
      format(addDays(startOfToday(), -30), 'yyyy-MM-dd'),
      format(startOfToday(), 'yyyy-MM-dd')
    )
    await context.factCheckCompletionRatePerSite()
  })
}

/**
 * Clean and fills FactCustomFieldCompletion table with stats for the specified date range
 * @param {*} dateFrom - date from
 * @param {*} dateTo - date to
 * @returns Quantity of rows inserted
 */
async function factFillCustomFieldsCompletionStats(dateFrom, dateTo) {
  let days = getArrayOfDaysInRange(dateFrom, dateTo)

  const definitions = await getCustomFieldsDefinitions()

  let { timeZone } =
    (await knex('Country as c')
      .innerJoin('TimeZone as tz', 'tz.id', 'c.timezone')
      .where('c.abbreviation', config.countryName)
      .first('tz.timeZone')) || {}

  if (!timeZone) {
    // To support local environment seeding without the correct countryName in .env
    // will get the first country in the database
    const firstCountry = await knex('Country as c')
      .innerJoin('TimeZone as tz', 'tz.id', 'c.timezone')
      .first('tz.timeZone')
    timeZone = firstCountry?.timeZone
  }

  const selectColumnClauses = convertCustomFieldsToColumnKnexClauses(definitions)

  const allFields = definitions.map(d => d.fields).flat()
  await knex('FactCustomFieldCompletion').whereRaw('date >= ?', dateFrom).delete()

  const allUpdatedRecords = []

  for (const day of days) {
    const startOfDay = slideDateToTimeZone(day, timeZone)
    const endOfDay = slideDateToTimeZone(addDays(day, 1), timeZone)
    // eslint-disable-next-line no-await-in-loop
    const updatedRecords = await getUpdatedRecords(startOfDay, endOfDay, dateFrom, dateTo)
    allUpdatedRecords.push(updatedRecords)
  }

  const flatUpdatedRecords = allUpdatedRecords.flat()

  const uniqueOutOfRangeDates = new Set()

  flatUpdatedRecords.forEach(record => {
    const { date } = record

    if (new Date(date) < new Date(dateFrom) || new Date(date) > new Date(dateTo)) {
      const formattedDate = new Date(date).toISOString().split('T')[0]
      uniqueOutOfRangeDates.add(formattedDate)
    }
  })

  const outOfRangeRecords = _.uniq(Array.from(uniqueOutOfRangeDates))

  const sortedDate = outOfRangeRecords.sort((a, b) => new Date(a) - new Date(b))

  days = [...sortedDate, ...days]
  let insertedStats = 0
  let records = []

  for (const day of days) {
    const startOfDay = slideDateToTimeZone(new Date(day), timeZone)
    const endOfDay = slideDateToTimeZone(addDays(new Date(day), 1), timeZone)
    // eslint-disable-next-line no-await-in-loop
    const results = await getResultsCustomFields(selectColumnClauses, startOfDay, endOfDay)
    const stats = generateStatsResult(allFields, results)

    insertedStats += stats.length

    records.push(...stats)

    if (records.length > bulkInsertThreshold) {
      // eslint-disable-next-line no-await-in-loop
      await knex('FactCustomFieldCompletion').insert(records).onConflict(['siteId', 'assayId', 'date']).merge()
      records = []
    }
  }

  if (records.length > 0) {
    await knex('FactCustomFieldCompletion').insert(records).onConflict(['siteId', 'assayId', 'date']).merge()
  }

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
          )},'') IN ('', 'null') THEN 0 ELSE 1 END) AS '${customField.fieldName}'`
        ),
      }))
    )
    .flat() // flatten fields from all forms
    .filter(
      // Unique clauses
      (value, index, array) => array.findIndex(v => v.clause.toString() === value.clause.toString()) === index
    )
}

function getUpdatedRecords(startOfDay, endOfDay, dateFrom, dateTo) {
  return knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'c.id', 'g.countryId')
    .leftOuterJoin('TimeZone as tz', 'c.timezone', 'tz.id')
    .leftOuterJoin('DeviceApproval as deviceApproval', 'd.deviceApprovalId', 'deviceApproval.id')
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as deviceMaintenanceStatusLog',
      'd.deviceMaintenanceStatusLogId',
      'deviceMaintenanceStatusLog.id'
    )
    .leftOuterJoin(
      'DeviceMaintenanceStatus as deviceMaintenanceStatus',
      'deviceMaintenanceStatusLog.deviceMaintenanceStatusId',
      'deviceMaintenanceStatus.id'
    )
    .innerJoin('ResultType as __constraints_ResultType', 'r.resultTypeId', '__constraints_ResultType.id')
    .where('s.disabled', 0)
    .whereRaw("IFNULL(deviceMaintenanceStatus.externalId, '') != 'inactiveDecommissioned'")
    .whereRaw("IFNULL(deviceApproval.token, '') != 'decommissioned'")
    .whereRaw("IFNULL(deviceApproval.token, 'approved') = 'approved'")
    .where('__constraints_ResultType.excluded', false)
    .whereBetween('r.updatedOn', [startOfDay, endOfDay])
    .whereNotBetween('r.endedOn', [dateFrom, dateTo])
    .select(knex.raw(`Date(CONVERT_TZ(COALESCE(r.endedOn, r.startedOn, r.createdOn), '+00:00', tz.timeZone)) as date`))
    .groupBy(`date`)
}

/**
 * Retrieve specified custom fields from Results
 * @param {*} customFieldsClauses - knex select clauses for each custom field
 * @param {*} dateFrom - date From
 * @param {*} dateTo - date to
 * @param {*} timeZone - timeZone
 * @returns Result set with a column for each custom field, and rows for each site, assay and date
 */
async function getResultsCustomFields(customFieldsClauses, dateFrom, dateTo) {
  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Country as c', 'c.id', 'g.countryId')
    .leftOuterJoin('TimeZone as tz', 'c.timezone', 'tz.id')
    .leftOuterJoin('DeviceApproval as deviceApproval', 'd.deviceApprovalId', 'deviceApproval.id')
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as deviceMaintenanceStatusLog',
      'd.deviceMaintenanceStatusLogId',
      'deviceMaintenanceStatusLog.id'
    )
    .leftOuterJoin(
      'DeviceMaintenanceStatus as deviceMaintenanceStatus',
      'deviceMaintenanceStatusLog.deviceMaintenanceStatusId',
      'deviceMaintenanceStatus.id'
    )
    .innerJoin('ResultType as __constraints_ResultType', 'r.resultTypeId', '__constraints_ResultType.id')
    .where('s.disabled', 0)
    .whereRaw("IFNULL(deviceMaintenanceStatus.externalId, '') != 'inactiveDecommissioned'")
    .whereRaw("IFNULL(deviceApproval.token, '') != 'decommissioned'")
    .whereRaw("IFNULL(deviceApproval.token, 'approved') = 'approved'")
    .where('__constraints_ResultType.excluded', false)
    .whereBetween('r.endedOn', [dateFrom, dateTo])
    .groupBy('s.id', 'a.id', knex.raw(`Date(CONVERT_TZ(r.endedOn, '+00:00', tz.timeZone))`))
    .select(
      's.id as siteId',
      's.name as siteName',
      'a.id as assayId',
      'at.diseaseId',
      knex.raw(`Date(CONVERT_TZ(r.endedOn, '+00:00', tz.timeZone)) as groupByDate`),
      knex.raw(`Date(CONVERT_TZ(COALESCE(r.endedOn, r.startedOn, r.createdOn), '+00:00', tz.timeZone)) as date`),
      ...customFieldsClauses.map(cf => cf.clause)
    )
    .count('* as recordCount')
    .orderBy('s.name')

  const results = await resultQuery
  return results
}

/**
 * Queries applicable forms from DB and returns the form definitions extracted from the forms JSON files
 * @returns {Object} Containing the form definitions
 */
async function getCustomFieldsDefinitions() {
  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .leftJoin('Disease as d', 'fd.diseaseId', 'd.id')
    .where('fd.partnerId', 1)
    .where('ft.externalId', 'gxConnectForm')
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fd.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )

  return queryForm.map(qf => ({
    file: qf.jsonSchemaFileName,
    assayId: qf.assayId,
    diseaseId: qf.diseaseId,
    formTypeId: qf.assayId,
    fields: formDictionary[qf.jsonSchemaFileName].fields
      .filter(field => field.completionWeight && field.source)
      .map(field => ({
        id: field.id,
        assayId: qf.assayId,
        diseaseId: qf.diseaseId,
        completionWeight: field.completionWeight || 0,
        fieldName: field.source,
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
        return f.assayId === r.assayId || (!f.assayId && (!f.diseaseId || f.diseaseId === r.diseaseId))
      })
      const statsRow = {
        siteId: r.siteId,
        assayId: r.assayId,
        date: r.date,
        completionByField: JSON.stringify(
          Object.fromEntries(
            currentFields.map(f => {
              const completionCount = r[f.fieldName]

              const totalWeight = fields.reduce((acc, cur) => {
                if ((!cur.assayId && !cur.diseaseId) || cur.assayId === r.assayId || cur.diseaseId === r.diseaseId) {
                  acc += cur.completionWeight
                }
                return acc
              }, 0)
              // completion weighting for current field
              // * is expressed as coefficient (i.e. 0.5 = 50% completion)
              // * all values references this date/site/assay combination:
              // (100 / record count) * (completion count / total weight) * completion weight / 100
              const fieldWeighting =
                ((100 / r.recordCount) * (completionCount / totalWeight) * f.completionWeight) / 100
              completionRate += fieldWeighting
              return [
                f.fieldName,
                {
                  completed: completionCount,
                  weighting: fieldWeighting.toFixed(5),
                },
              ]
            })
          )
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
  // Hack: for now, we support inconsistencies in the form processing.
  if (customField.fieldName === 'patientData.age' || customField.fieldName === 'patientData.PatientAge') {
    return `COALESCE(
    r.patientData ->> '$.PatientAge',
    r.patientData ->> '$.age')`
  }

  if (customField.fieldName === 'patientData.PatientGender' || customField.fieldName === 'patientData.gender') {
    return `COALESCE(
    r.patientData ->> '$.PatientGender',
    r.patientData ->> '$.gender')`
  }

  if (customField.fieldName === 'patientData.name' || customField.fieldName === 'patientData.PatientName') {
    return `COALESCE(
    r.patientData ->> '$.PatientName',
    r.patientData ->> '$.name')`
  }

  if (
    customField.fieldName === 'patientData.PatientPhone' ||
    customField.fieldName === 'patientData.RequestorPhone' ||
    customField.fieldName === 'patientData.phone'
  ) {
    return `COALESCE(
    r.patientData ->> '$.PatientPhone',
    r.patientData ->> '$.patientPhone',
    r.patientData ->> '$.phone')`
  }

  if (customField.fieldName === 'patientData.PatientStreet') {
    return `COALESCE(
    r.patientData ->> '$.PatientStreet',
    r.patientData ->> '$.street')`
  }

  if (
    customField.fieldName === 'patientData.MWHealthFacilityName' ||
    customField.fieldName === 'patientData.ReferringFacility'
  ) {
    return `COALESCE(
    r.patientData ->> '$.HealthFacility',
    r.patientData ->> '$.ReferringFacility')`
  }

  const customFieldPath = customField.fieldName.split('.')
  return customFieldPath.length > 1
    ? `r.${customFieldPath[0]} ->> '$.${customFieldPath[1]}'`
    : `r.${customFieldPath[0]}`
}

module.exports = {
  factFillCustomFieldsCompletionStats,
  factFillCustomFieldsCompletionStatsLast30Days,
}
