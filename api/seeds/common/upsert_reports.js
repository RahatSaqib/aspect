const Promise = require('bluebird')
const _ = require('lodash')
const commonReportFixture = require('../fixtures/Report')
const { getIdsByExternalId } = require('../../src/shared/dictionary')
const { LEGACY_REPORT_PARAMETERS } = require('../../src/report/params')
const { mapExternalIdToId } = require('./utils')

async function upsertSheets(knex, reportId, sheets) {
  await knex('ReportSheet').where({ reportId }).delete()
  await Promise.all(
    sheets.map(({ query, ...sheet }) =>
      knex('ReportSheet').insert({
        ...sheet,
        query: JSON.stringify(query),
        reportId,
      })
    )
  )
}

module.exports = async function upsertReports(knex, countrySpecificReportFixture = {}, omitFields = []) {
  const assayIds = await getIdsByExternalId('Assay')
  const deviceTypeIds = await getIdsByExternalId('DeviceType')
  const resultCategoryIds = await getIdsByExternalId('ResultCategory')

  const actualReports = {
    ..._.cloneDeep(_.omit(commonReportFixture, ['genexpert_issues'])),
    ..._.cloneDeep(countrySpecificReportFixture),
  }
  const reportsById = {}
  _.values(actualReports).forEach(report => {
    const sheets = []
    report.sheets.forEach(({ query = {}, ...sheet }) => {
      // Replace externalIds with Ids
      if (query.resultCategoryId) query.resultCategoryId = resultCategoryIds[query.resultCategoryId]

      if (query.resultCategory2Id) query.resultCategory2Id = resultCategoryIds[query.resultCategory2Id]

      if (query.assayId) query.assayId = mapExternalIdToId(assayIds, query.assayId)

      if (query.deviceTypeId) query.deviceTypeId = mapExternalIdToId(deviceTypeIds, query.deviceTypeId)

      sheets.push({ ...sheet, query })
    })

    // Set report by external id
    reportsById[report.externalId] = { ...report, sheets }
  })

  const whitelist = Object.keys(reportsById)

  // remove reports which are not in a whitelist
  const removeReportIds = await knex('Report').whereNotIn('externalId', whitelist).pluck('id')
  // delete report job functions and then reports
  await knex('JobFunctionReport').whereIn('reportId', removeReportIds).delete()
  await knex('Report').whereIn('id', removeReportIds).delete()

  await Promise.each(whitelist, async externalId => {
    const { sheets, ...report } = reportsById[externalId]

    const reportToUpdate = await knex('Report').where({ externalId }).first()
    let reportId
    const reportData = {
      ..._.omit(report, omitFields),
      validations: JSON.stringify(report.validations),
      parameters: JSON.stringify(report.parameters ?? LEGACY_REPORT_PARAMETERS),
    }

    if (reportToUpdate) {
      // Update
      await knex('Report').where({ externalId }).update(reportData)
      reportId = reportToUpdate.id
    } else {
      // Create
      ;[reportId] = await knex('Report').insert({
        sortOrder: 0, // defaults to 0 if sortOrder is missing in 'report', need because 'sortOrder' is NOT NULL field
        ...reportData,
      })
    }

    await upsertSheets(knex, reportId, sheets)
  })
}
