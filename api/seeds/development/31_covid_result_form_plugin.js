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
  const covidResultFormData = await knex('AssayType as at')
    .join('Assay as a', 'at.id', 'a.assayTypeId')
    .join('Result as r', 'a.id', 'r.assayId')
    .where('at.externalId', 'covid19')
    .whereNotNull('r.formData')
    .select('r.id', 'r.formData')
    .map(result => ({
      id: result.id,
      formData: JSON.parse(result.formData),
    }))
  await Promise.each(covidResultFormData, async result => {
    if (result.formData.age) {
      result.formData.ageYears = result.formData.age
      delete result.formData.age
      return knex('Result')
        .where('id', result.id)
        .update({ formData: JSON.stringify(result.formData) })
    }
    return Promise.resolve()
  })
}
