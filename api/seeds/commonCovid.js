const _ = require('lodash')
const Promise = require('bluebird')
const {
  assayTypeToId,
  resultSourceToId,
  deviceTypeCategoryToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const { updateAssayResultCategoryTreatmentEmphasize } = require('./utils')
const AssayCovidPatientDataSchema = require('./fixtures/AssayCovidPatientDataSchema.json')
const AssayCovidResultDataSchema = require('./fixtures/AssayCovidResultDataSchema.json')
const AssayCovidResultFormSchema = require('./fixtures/AssayCovidResultFormSchema.json')

async function upsertCovidDeviceTypes(
  knex,
  partnerId,
  resultFormSchema = AssayCovidResultFormSchema,
  patientDataSchema = AssayCovidPatientDataSchema,
  resultDataSchema = AssayCovidResultDataSchema
) {
  const values = await Promise.all([
    resultCategoryToId('Positive'),
    resultCategoryToId('Negative'),
    resultCategoryToId('Inconclusive'),
    resultCategoryToId('Unknown'),
  ])
  const covidDeviceTypes = []
  await Promise.each(
    [
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId(
          'Information System'
        ),
        externalId: 'Aspect',
        name: 'Aspect',
        manufacturer: 'SystemOne',
        plugin: 'aspectresultentry',
        assayName: 'COVID-19 PCR',
        abbreviation: 'PCR',
        resultSourceId: await resultSourceToId('EnteredByHand'),
        oldExternalId: 'AspectResultEntry',
        oldAssayExternalId: 'assayAspectResultEntryCovid19',
      },
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
        externalId: 'rocheMagnaPure96',
        name: 'MagNA Pure-96',
        manufacturer: 'Roche',
        plugin: 'aspectresultentry',
        abbreviation: 'MP96',
        resultSourceId: await resultSourceToId('EnteredByHand'),
      },
      {
        deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
        externalId: 'appliedBiosystemsQuantStudio7Flex',
        name: 'QuantStudio7 Flex',
        manufacturer: 'Applied Biosystems',
        plugin: 'aspectresultentry',
        abbreviation: 'QS7',
        resultSourceId: await resultSourceToId('EnteredByHand'),
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
            _.uniq([
              deviceTypeSpec.externalId,
              deviceTypeSpec.oldExternalId || deviceTypeSpec.externalId,
            ])
          )
          .first()) ||
        _.pick(deviceTypeSpec, [
          'deviceTypeCategoryId',
          'externalId',
          'name',
          'manufacturer',
          'plugin',
        ])
      if (deviceType.id) {
        await knex('DeviceType')
          .where('id', deviceType.id)
          .update(deviceType)
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
        resultDataSchema: JSON.stringify(resultDataSchema),
        patientDataSchema: JSON.stringify(patientDataSchema),
      }

      let { id: assayCovidId } =
        (await knex('Assay')
          .whereIn(
            'externalId',
            _.uniq([
              assayCovid19.externalId,
              deviceTypeSpec.oldAssayExternalId || assayCovid19.externalId,
            ])
          )
          .where('externalId', assayCovid19.externalId)
          .first('id')) || {}

      if (!assayCovidId) {
        assayCovidId = await knex('Assay').insert(assayCovid19)
      } else {
        await knex('Assay')
          .where('id', assayCovidId)
          .update(assayCovid19)
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

      await Promise.each(categoriesToInsert, elem =>
        knex('ResultCategoryAssay').insert({
          resultCategoryId: elem,
          assayId: assayCovidId,
        })
      )

      const resultForm = await knex('ResultForm')
        .where({
          partnerId,
          assayId: assayCovidId,
        })
        .first()
      if (!resultForm) {
        await knex('ResultForm').insert({
          partnerId,
          assayId: assayCovidId,
          formSchema: JSON.stringify(resultFormSchema),
        })
      } else if (resultForm.formSchema) {
        const formSchema = JSON.parse(resultForm.formSchema)
        if (formSchema.sendChangesOn !== resultForm.sendChangesOn) {
          formSchema.sendChangesOn = resultForm.sendChangesOn
          await knex('ResultForm')
            .where({
              partnerId,
              assayId: assayCovidId,
            })
            .update({
              formSchema: JSON.stringify(formSchema),
            })
        }
      }
      covidDeviceTypes.push(deviceType)
    }
  )

  await updateAssayResultCategoryTreatmentEmphasize(knex)
  return covidDeviceTypes
}

module.exports = {
  upsertCovidDeviceTypes,
}
