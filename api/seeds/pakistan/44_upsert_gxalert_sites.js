module.exports = require('../utils').seed(seed, __filename)

const { upsertSites, getStatesByName } = require('../common')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const { adminUserName } = partnerData
  const { id: adminId } = (await knex('User').where('name', adminUserName).first('id')) || {}

  const { countries } = geographyFromGxAlert
  const country = await knex('Country as c')
    .where('c.abbreviation', countries[0].abbreviation)
    .first('c.id', 'c.culture', 'c.timezone')
  const { id: countryId } = country
  const { id: partnerId } = await knex('Partner as p').first()
  const statesByName = await getStatesByName(knex, countryId)
  await upsertSites(knex, adminId, partnerId, country, statesByName, sitesFromGxAlert)
}
