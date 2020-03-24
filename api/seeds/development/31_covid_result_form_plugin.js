module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { commonUpserts } = require('../common')
const { upsertCovidDeviceTypes } = require('../commonCovid')
const utils = require('../utils')

const geography = require('./fixtures/geography.json')
const wakandaCovidResultFormSchema = require('./fixtures/wakandaCovidResultFormSchema.json')

async function seed(knex) {
  utils.hasSeededStaticData = true

  const { id: partnerId } = await knex('Partner')
    .where('name', 'Wakanda')
    .first('id')

  const covidDeviceTypes = await upsertCovidDeviceTypes(
    knex,
    partnerId,
    wakandaCovidResultFormSchema
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
  const aspectGenericResultForm = await knex('Assay as a')
    .join('ResultForm as rf', 'a.id', 'rf.assayId')
    .where('a.externalId', 'assayGenericCovid19')
    .andWhere('rf.partnerId', partnerId)
    .first('rf.*')
  if (aspectGenericResultForm) {
    const aspectGenericResultFormSchema = JSON.parse(
      aspectGenericResultForm.formSchema
    )
    if (!aspectGenericResultFormSchema.fields.testType) {
      Object.keys(aspectGenericResultFormSchema.fields).forEach(
        assayResultFormSchemaFieldKey => {
          aspectGenericResultFormSchema.fields[
            assayResultFormSchemaFieldKey
          ].order += 1
        }
      )
      const minFieldOrder = Math.min(
        Object.values(aspectGenericResultFormSchema.fields).map(
          field => field.order
        )
      )
      aspectGenericResultFormSchema.fields.testType = {
        i18nLabel: 'testType',
        control: {
          type: 'DropDown',
          options: [
            {
              title: 'PCR/molecular',
              i18nText: 'pcr',
              value: 'pcr',
            },
            {
              title: 'Immunoassay',
              i18nText: 'immunoassay',
              value: 'immunoassay',
            },
            {
              title: 'Rapid diagnostic test',
              i18nText: 'rapidDiagnosticTest',
              value: 'rapidDiagnosticTest',
            },
            {
              title: 'Digital X-Ray',
              i18nText: 'digitalXRay',
              value: 'digitalXRay',
            },
          ],
        },
        order: minFieldOrder - 1,
      }
      await knex('ResultForm')
        .where({
          assayId: aspectGenericResultForm.assayId,
          partner: aspectGenericResultForm.partnerId,
        })
        .update({
          formSchema: JSON.stringify(aspectGenericResultFormSchema),
        })
    }
  }
}
