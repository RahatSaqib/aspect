module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { sites } = require('./fixtures/sites.json')
const { insertSites } = require('../utils')
const partnerData = require('./fixtures/partnerData')
const geography = require('./fixtures/geography.json')
const { upsertStatesAndLgas } = require('../common')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where('name', 'Nigeria').first('id')

  const { id: partnerId } = await knex('Partner').where('externalId', partnerData.partner.externalId).first('id')

  await upsertStatesAndLgas(knex, countryId, geography.countries[0].states)

  await insertSites(knex, partnerId, countryId, sites)

  const devicesClinics = [
    {
      hostId: 'GH Badagry',
      defaultReportableSiteExternalId: '4103',
    },
    {
      hostId: 'Sango PHC Agege',
      defaultReportableSiteExternalId: '3917',
    },
  ]

  await Promise.each(devicesClinics, async ({ hostId, defaultReportableSiteExternalId }) => {
    const { id: defaultReportableSiteId } =
      (await knex('Site').where({ externalId: defaultReportableSiteExternalId }).first()) || {}
    if (defaultReportableSiteId) await knex('Device').where({ hostId }).update({ defaultReportableSiteId })
  })
}
