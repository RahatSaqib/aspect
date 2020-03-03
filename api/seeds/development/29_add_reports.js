module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const reports = require('../fixtures/reports.json')

async function seed(knex) {
  const countries = await knex('Country').select('id')
  await Promise.each(countries, async ({ id: countryId }) => {
    let geographyId
    const geography = await knex('Geography')
      .where({ countryId })
      .whereNull('stateId')
      .whereNull('lgaId')
      .first('id')
    if (geography) {
      geographyId = geography.id
    } else {
      ;[geographyId] = await knex('Geography').insert({ countryId })
    }

    await Promise.each(
      reports,
      async (
        { name, description, i18nKey, externalId, sheets, fileNamePrefix },
        reportIndex
      ) => {
        const [reportId] = await knex('Report').insert({
          name,
          description,
          i18nKey,
          externalId,
          geographyId,
          sortOrder: reportIndex + 1,
          fileNamePrefix,
        })

        await Promise.each(sheets, async (sheet, sheetIndex) => {
          const { endpoint, query, sheetName, title } = sheet
          await knex('ReportSheet').insert({
            endpoint,
            query: query && JSON.stringify(query),
            reportId,
            sheetName,
            title,
            sortOrder: sheetIndex + 1,
          })
        })
      }
    )
  })
}
