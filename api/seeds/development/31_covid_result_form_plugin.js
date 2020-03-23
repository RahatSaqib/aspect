module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { commonUpserts } = require('../common')
const { upsertCovidDeviceTypes } = require('../commonCovid')
const utils = require('../utils')

const geography = require('./fixtures/geography.json')
const AssayCovidResultFormSchema = require('../fixtures/AssayCovidResultFormSchema.json')

async function seed(knex) {
  utils.hasSeededStaticData = true

  const { id: partnerId } = await knex('Partner')
    .where('name', 'Wakanda')
    .first('id')

  const covidDeviceTypes = await upsertCovidDeviceTypes(
    knex,
    partnerId,
    AssayCovidResultFormSchema
  )
  await Promise.each(
    covidDeviceTypes.map(deviceType => deviceType.id),
    async deviceTypeId =>
      knex('DeviceType')
        .where('id', deviceTypeId)
        .whereNull('plugin')
        .update({ plugin: 'aspectresultentry' })
  )

  const { id: adminId } = await knex('User')
    .where('name', 'covid_admin')
    .first('id')
  const countryWakanda = geography.countries.find(
    country => country.abbreviation === 'WK'
  )
  await commonUpserts(
    knex,
    partnerId,
    adminId,
    {
      countries: [countryWakanda],
    },
    'WK'
  )
}
