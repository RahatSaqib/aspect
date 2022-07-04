const Promise = require('bluebird')
const _ = require('lodash')
const commonReportFixture = require('../fixtures/Report')
const { allResultCategoryToId } = require('../../src/shared/dictionary')

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
  countrySpecificReportFixture = {},
  omitFields = []
) {
  const assayIds = {}
  await Promise.each(knex('Assay'), assay => {
    assayIds[assay.externalId] = assay.id
  })
  const deviceTypeIds = {}
  await Promise.each(knex('DeviceType'), deviceType => {
    deviceTypeIds[deviceType.externalId] = deviceType.id
  })
  const resultCategoryGroupIds = {}
  await Promise.each(knex('ResultCategoryGroup'), resultCategoryGroup => {
    resultCategoryGroupIds[resultCategoryGroup.externalId] =
      resultCategoryGroup.id
  })

  const resultCategoryIds = await allResultCategoryToId()

  const actualReports = {
    ..._.cloneDeep(commonReportFixture),
    ..._.cloneDeep(countrySpecificReportFixture),
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

      const assayExternalId = query.assayId
      if (assayExternalId) {
        // Support filtering by multiple assay ids
        if (_.isArray(assayExternalId)) {
          query.assayId = []
          assayExternalId.forEach(externalId => {
            query.assayId.push(assayIds[externalId])
          })
        } else {
          query.assayId = assayIds[assayExternalId]
        }
      }

      const deviceTypeExternalId = query.deviceTypeId
      if (deviceTypeExternalId) {
        // Support filtering by multiple deviceType ids
        if (_.isArray(deviceTypeExternalId)) {
          query.deviceTypeId = []
          deviceTypeExternalId.forEach(externalId => {
            query.deviceTypeId.push(deviceTypeIds[externalId])
          })
        } else {
          query.deviceTypeId = deviceTypeIds[deviceTypeExternalId]
        }
      }

      const resultCategoryGroupExternalId = query.resultCategoryGroupId
      if (resultCategoryGroupExternalId) {
        // Support filtering by multiple resultCategoryGroup ids
        if (_.isArray(resultCategoryGroupExternalId)) {
          query.resultCategoryGroupId = []
          resultCategoryGroupExternalId.forEach(externalId => {
            query.resultCategoryGroupId.push(resultCategoryGroupIds[externalId])
          })
        } else {
          query.resultCategoryGroupId =
            resultCategoryGroupIds[resultCategoryGroupExternalId]
        }
      }

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
      await knex('Report')
        .where({ externalId })
        .update(_.omit(report, omitFields))
      reportId = reportToUpdate.id
    } else {
      // Create
      await knex('Report').insert({
        sortOrder: 0, // defaults to 0 if sortOrder is missing in 'report', need because 'sortOrder' is NOT NULL field
        ..._.omit(report, omitFields),
      })
      ;[reportId] = await knex('Report').where({ externalId }).pluck('id')
    }

    await upsertSheets(knex, reportId, sheets)
  })
}
