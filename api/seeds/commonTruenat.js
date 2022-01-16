const _ = require('lodash')
const Promise = require('bluebird')
const truenatDeviceTypes = require('./fixtures/truenatDevice/DeviceType.json')
const truenatAssays = require('./fixtures/truenatDevice/Assays.json')
const truenatPatientDataSchema = require('./fixtures/truenatDevice/PatientDataSchema.json')
const truenatResultDataSchema = require('./fixtures/truenatDevice/ResultDataSchema.json')
const { seedPartnerAssay, seedPartnerDisease } = require('./utils')

async function upsertTruenatDeviceTypeAndAssays(
  knex,
  assays = truenatAssays,
  defaultPatientDataSchema = truenatPatientDataSchema,
  defaultResultDataSchema = truenatResultDataSchema
) {
  const deviceTypeIds = {}
  await Promise.each(truenatDeviceTypes, async truenatDeviceType => {
    if (
      !_.some(
        assays,
        assay => assay.deviceTypeId === truenatDeviceType.externalId
      )
    ) {
      return Promise.resolve()
    }
    const { id: existingDeviceTypeId } =
      (await knex('DeviceType')
        .where('externalId', truenatDeviceType.externalId)
        .first('id')) || {}
    const { id: deviceTypeCategoryId } =
      (await knex('DeviceTypeCategory')
        .where('name', truenatDeviceType.deviceTypeCategoryId)
        .first('id')) || {}
    if (!existingDeviceTypeId) {
      const [createdDeviceTypeId] = await knex('DeviceType').insert({
        ...truenatDeviceType,
        deviceTypeCategoryId,
      })
      deviceTypeIds[truenatDeviceType.externalId] = createdDeviceTypeId
    } else {
      await knex('DeviceType')
        .where('id', existingDeviceTypeId)
        .update({
          ...truenatDeviceType,
          deviceTypeCategoryId,
        })
      deviceTypeIds[truenatDeviceType.externalId] = existingDeviceTypeId
    }
  })
  const assayIds = {}
  await Promise.each(assays, async truenatAssay => {
    const { id: existingAssayId } =
      (await knex('Assay')
        .where('externalId', truenatAssay.externalId)
        .first('id')) || {}
    if (!existingAssayId) {
      const { id: assayTypeId } =
        (await knex('AssayType')
          .where('externalId', truenatAssay.assayTypeId)
          .first('id')) || {}
      const deviceTypeId = deviceTypeIds[truenatAssay.deviceTypeId]
      const { id: resultSourceId } =
        (await knex('ResultSource')
          .where('externalId', truenatAssay.resultSourceId)
          .first('id')) || {}
      const [createdAssayId] = await knex('Assay').insert({
        patientDataSchema: JSON.stringify(defaultPatientDataSchema),
        resultDataSchema: JSON.stringify(defaultResultDataSchema),
        ...truenatAssay,
        assayTypeId,
        deviceTypeId,
        resultSourceId,
      })
      assayIds[truenatAssay.externalId] = createdAssayId
    } else {
      assayIds[truenatAssay.externalId] = existingAssayId
    }
  })

  const assayTruenatMtbResultCategories = [
    'Detected',
    'NotDetected',
    'Invalid',
    'NoResult',
    'Error',
  ]
  const positiveResultCategories = ['Detected', 'Resistant']
  await Promise.each(
    assayTruenatMtbResultCategories,
    async truenatMtbResultCategory => {
      const { id: resultCategoryId } =
        (await knex('ResultCategory')
          .where('externalId', truenatMtbResultCategory)
          .first('id')) || {}
      const sharedTruenatMtbResultCategoryAssayProperties = {
        emphasize: false,
        requiresTreatment: positiveResultCategories.includes(
          truenatMtbResultCategory
        ),
        reportable: true,
      }
      await Promise.each(
        ['assayTruenatMtb', 'assayTruenatMtbPlus'],
        async truenatMtbAssayId => {
          const resultCategoryAssayTruenatMtb = {
            assayId: assayIds[truenatMtbAssayId],
            resultCategoryId,
          }
          const existingResultCategoryAssayTruenatMtb = await knex(
            'ResultCategoryAssay'
          )
            .where(resultCategoryAssayTruenatMtb)
            .first()
          if (!existingResultCategoryAssayTruenatMtb) {
            return knex('ResultCategoryAssay').insert({
              ...resultCategoryAssayTruenatMtb,
              ...sharedTruenatMtbResultCategoryAssayProperties,
            })
          }
        }
      )
    }
  )

  const assayTruenatMtbRifDxResultCategories = [
    'Resistant',
    'Susceptible',
    'Invalid',
    'NoResult',
    'Error',
  ]
  await Promise.each(
    assayTruenatMtbRifDxResultCategories,
    async truenatMtbRifDxResultCategory => {
      const { id: resultCategoryId } =
        (await knex('ResultCategory')
          .where('externalId', truenatMtbRifDxResultCategory)
          .first('id')) || {}
      const resultCategoryAssayTruenatMtbRifDx = {
        assayId: assayIds.assayTruenatRif,
        resultCategoryId,
      }
      const existingResultCategoryAssayTruenatMtbRifDx = await knex(
        'ResultCategoryAssay'
      )
        .where(resultCategoryAssayTruenatMtbRifDx)
        .first()
      if (!existingResultCategoryAssayTruenatMtbRifDx) {
        return knex('ResultCategoryAssay').insert({
          ...resultCategoryAssayTruenatMtbRifDx,
          emphasize: truenatMtbRifDxResultCategory === 'Resistant',
          requiresTreatment: positiveResultCategories.includes(
            truenatMtbRifDxResultCategory
          ),
          reportable: true,
        })
      }
    }
  )

  const assayTruenatUnknownResultCategories = ['Unknown', 'Missing']
  await Promise.each(
    assayTruenatUnknownResultCategories,
    async assayTruenatUnknownResultCategory => {
      const { id: resultCategoryId } =
        (await knex('ResultCategory')
          .where('externalId', assayTruenatUnknownResultCategory)
          .first('id')) || {}
      const resultCategoryAssayTruenatUnknown = {
        assayId: assayIds.assayTruenatUnknown,
        resultCategoryId,
        emphasize: false,
        requiresTreatment: false,
        reportable: false,
      }
      const existingResultCategoryAssayTruenatUnknown = await knex(
        'ResultCategoryAssay'
      )
        .where({
          assayId: assayIds.assayTruenatUnknown,
          resultCategoryId,
        })
        .first()
      if (!existingResultCategoryAssayTruenatUnknown) {
        await knex('ResultCategoryAssay').insert(
          resultCategoryAssayTruenatUnknown
        )
      }
    }
  )

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

module.exports = {
  upsertTruenatDeviceTypeAndAssays,
}
