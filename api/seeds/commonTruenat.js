const _ = require('lodash')
const Promise = require('bluebird')
const {
  assayTypeToId,
  assayToId,
  deviceTypeToId,
  deviceTypeCategoryToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
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
    const existingDeviceTypeId = await deviceTypeToId(
      truenatDeviceType.externalId
    )
    if (!existingDeviceTypeId) {
      const deviceTypeCategoryId = await deviceTypeCategoryToId(
        truenatDeviceType.deviceTypeCategoryId
      )
      const [createdDeviceTypeId] = await knex('DeviceType').insert({
        ...truenatDeviceType,
        deviceTypeCategoryId,
      })
      deviceTypeIds[truenatDeviceType.externalId] = createdDeviceTypeId
    } else {
      deviceTypeIds[truenatDeviceType.externalId] = existingDeviceTypeId
    }
  })

  const assayIds = {}
  await Promise.each(assays, async truenatAssay => {
    const existingAssayId = await assayToId(truenatAssay.externalId)
    if (!existingAssayId) {
      const assayTypeId = await assayTypeToId(truenatAssay.assayTypeId)
      const deviceTypeId = deviceTypeIds[truenatAssay.deviceTypeId]
      const resultSourceId = await resultSourceToId(truenatAssay.resultSourceId)
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
      const resultCategoryId = await resultCategoryToId(
        truenatMtbResultCategory
      )
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
            await knex('ResultCategoryAssay').insert({
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
      const resultCategoryId = await resultCategoryToId(
        truenatMtbRifDxResultCategory
      )
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
        await knex('ResultCategoryAssay').insert({
          ...existingResultCategoryAssayTruenatMtbRifDx,
          emphasize: truenatMtbRifDxResultCategory === 'Resistant',
          requiresTreatment: positiveResultCategories.includes(
            truenatMtbRifDxResultCategory
          ),
          reportable: true,
        })
      }
    }
  )

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

module.exports = {
  upsertTruenatDeviceTypeAndAssays,
}
