const Promise = require('bluebird')
const _ = require('lodash')
const ReportFixture = require('../fixtures/Report')
const {
  allAssayToId,
  allResultCategoryToId,
} = require('../../src/shared/dictionary')

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

module.exports = async function upsertReports(
  knex,
  countrySpecificReportFixture
) {
  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const actualReports = {
    ..._.omit(ReportFixture, 'fixture'),
    ..._.omit(countrySpecificReportFixture || {}, 'fixture'),
  }
  const reportsById = {}

  _.values(actualReports).forEach(report => {
    const sheets = []
    report.sheets.forEach(({ query = {}, ...sheet }) => {
      // Replace externalIds with Ids
      if (query.resultCategoryId)
        query.resultCategoryId = resultCategoryIds[query.resultCategoryId]

      if (query.resultCategory2Id)
        query.resultCategory2Id = resultCategoryIds[query.resultCategory2Id]

      if (query.assayId) query.assayId = assayIds[query.assayId]

      sheets.push({ ...sheet, query })
    })

    // Set report by external id
    reportsById[report.externalId] = { ...report, sheets }
  })

  const whitelist = Object.keys(reportsById)

  // remove reports which are not in a whitelist
  const removeReportIds = await knex('Report')
    .whereNotIn('externalId', whitelist)
    .pluck('id')
  // delete report job functions and then reports
  await knex('JobFunctionReport').whereIn('reportId', removeReportIds).delete()
  await knex('Report').whereIn('id', removeReportIds).delete()

  await Promise.each(whitelist, async externalId => {
    const { sheets, ...report } = reportsById[externalId]

    const reportToUpdate = await knex('Report').where({ externalId }).first()
    let reportId

    if (reportToUpdate) {
      // Update
      await knex('Report').where({ externalId }).update(report)
      reportId = reportToUpdate.id
    } else {
      // Create
      await knex('Report').insert({
        sortOrder: 0, // defaults to 0 if sortOrder is missing in 'report', need because 'sortOrder' is NOT NULL field
        ...report,
      })
      ;[reportId] = await knex('Report').where({ externalId }).pluck('id')
    }

    await upsertSheets(knex, reportId, sheets)
  })
}
