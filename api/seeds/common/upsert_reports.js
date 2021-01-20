const Promise = require('bluebird')
const { fixture: ReportFixture } = require('../fixtures/Report')
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

module.exports = async function upsertReports(knex) {
  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const reportsById = {}

  ReportFixture.forEach(report => {
    const sheets = []

    report.sheets.forEach(({ query, ...sheet }) => {
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

  // Remote
  await knex('Report').whereNotIn('externalId', whitelist).delete()

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
