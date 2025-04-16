const _ = require('lodash')
const Promise = require('bluebird')
const {
  assayTypeToId,
  resultSourceToId,
  deviceTypeCategoryToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const { updateAssayResultCategoryTreatmentEmphasize, seedPartnerAssay, seedPartnerDisease } = require('./utils')
const patientDataSchema = require('./fixtures/AssayCovidPatientDataSchema.json')
const resultDataSchema = require('./fixtures/AssayCovidResultDataSchema.json')

async function upsertCovidDeviceTypes(knex) {
  const values = await Promise.all([
    resultCategoryToId('Positive'),
    resultCategoryToId('Negative'),
    resultCategoryToId('Inconclusive'),
    resultCategoryToId('Unknown'),
    resultCategoryToId('PresumptivePositive'),
  ])
  const covidDeviceTypes = []
  await Promise.each(
    [
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
        externalId: 'rocheMagnaPure96',
        name: 'MagNA Pure-96',
        manufacturer: 'Roche',
        plugin: 'aspectresultentry',
        abbreviation: 'MP96',
        resultSourceId: await resultSourceToId('DiagnosticDevice'),
      },
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
        externalId: 'appliedBiosystemsQuantStudio7Flex',
        name: 'QuantStudio7 Flex',
        manufacturer: 'Applied Biosystems',
        plugin: 'aspectresultentry',
        abbreviation: 'QS7',
        resultSourceId: await resultSourceToId('DiagnosticDevice'),
      },
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
        externalId: 'CepheidGeneXpert',
        name: 'GeneXpert',
        manufacturer: 'Cepheid',
        plugin: 'gxconnect',
        abbreviation: 'GX',
        resultSourceId: await resultSourceToId('DiagnosticDevice'),
      },
    ],
    async deviceTypeSpec => {
      const deviceType =
        (await knex('DeviceType')
          .whereIn(
            'externalId',
            _.uniq([deviceTypeSpec.externalId, deviceTypeSpec.oldExternalId || deviceTypeSpec.externalId])
          )
          .first()) || _.pick(deviceTypeSpec, ['deviceTypeCategoryId', 'externalId', 'name', 'manufacturer', 'plugin'])
      if (deviceType.id) {
        await knex('DeviceType').where('id', deviceType.id).update(deviceType)
      } else {
        const [deviceTypeId] = await knex('DeviceType').insert(deviceType)
        deviceType.id = deviceTypeId
      }

      const assayCovid19 = {
        name: deviceTypeSpec.assayName || `${deviceTypeSpec.name} COVID-19`,
        abbreviation: `${deviceTypeSpec.abbreviation} COVID-19`,
        i18nKey: `assay${deviceTypeSpec.abbreviation}Covid19`,
        externalId: `assay${deviceTypeSpec.abbreviation}Covid19`,
        assayTypeId: await assayTypeToId('COVID-19 Test'),
        deviceTypeId: deviceType.id,
        resultSourceId: deviceTypeSpec.resultSourceId,
        resultCategory1Label: 'COVID-19',
        resultCategory1i18nKey: 'resultCategoryCovid19',
        resultDataSchema: JSON.stringify(
          deviceTypeSpec.abbreviation === 'Generic' && !resultDataSchema.typeOfTest
            ? {
                ...resultDataSchema,
                typeOfTest: { type: 'string', title: 'Type of Test' },
              }
            : resultDataSchema
        ),
        patientDataSchema: JSON.stringify(patientDataSchema),
      }

      let { id: assayCovidId } =
        (await knex('Assay')
          .whereIn(
            'externalId',
            _.uniq([assayCovid19.externalId, deviceTypeSpec.oldAssayExternalId || assayCovid19.externalId])
          )
          .where('externalId', assayCovid19.externalId)
          .first('id')) || {}

      if (!assayCovidId) {
        ;[assayCovidId] = await knex('Assay').insert(assayCovid19)
      } else {
        await knex('Assay').where('id', assayCovidId).update(assayCovid19)
      }
      const resultCategoryId = await knex('ResultCategoryAssay')
        .where({ assayId: assayCovidId })
        .select('resultCategoryId')

      const categoriesToInsert = _.filter(
        values,
        elem =>
          !_.includes(
            _.map(resultCategoryId, category => category.resultCategoryId),
            elem
          )
      )

      const rows = categoriesToInsert.map(resultCategoryId => ({
        resultCategoryId,
        assayId: assayCovidId,
      }))
      if (rows.length > 0) {
        await knex('ResultCategoryAssay').insert(rows)
      }

      covidDeviceTypes.push(deviceType)
    }
  )

  await updateAssayResultCategoryTreatmentEmphasize(knex)
  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)

  return covidDeviceTypes
}

module.exports = {
  upsertCovidDeviceTypes,
}
