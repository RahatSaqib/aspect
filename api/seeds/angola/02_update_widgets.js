module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const _ = require('lodash')
const { upsertDashboardWidgets } = require('../common')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const dashboardWidgets = require('./fixtures/dashboardWidget')
const geography = require('./fixtures/geography.json')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')
  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)

  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, ['abbreviation', 'a3', 'culture'])
    return knex('Country').update(countryData).where('abbreviation', country.abbreviation)
  })
}
