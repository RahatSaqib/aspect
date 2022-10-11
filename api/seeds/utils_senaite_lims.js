const _ = require('lodash')
const Promise = require('bluebird')
const { assayTypeToId, resultSourceToId } = require('../src/shared/dictionary')
const { seedPartnerAssay, seedPartnerDisease } = require('./utils')

async function seedSenaiteLimsAssays(knex, assayExternalIds) {
  const senaiteLimsResultDataSchema = {
    senaiteAnalysisRequest: {
      list: false,
      order: 0,
      type: 'object',
      title: 'Senaite LIMS Analysis Request',
      properties: {
        profile: {
          title: 'Profile',
          type: 'string',
          order: 0,
        },
        priority: {
          title: 'Priority',
          type: 'number',
          order: 1,
        },
        doctorTitle: {
          title: 'Doctor Title',
          type: 'string',
          order: 2,
        },
        dateVerified: {
          title: 'verified On',
          type: 'time',
          order: 3,
        },
        printed: {
          title: 'Printed',
          type: 'number',
          order: 4,
        },
        creator: {
          title: 'Created By',
          type: 'string',
          order: 5,
        },
        creatorFullName: {
          title: 'Created By (Name)',
          type: 'string',
          order: 6,
        },
        creatorEmail: {
          title: 'Created By (Email)',
          type: 'string',
          order: 7,
        },
        creationDate: {
          title: 'Created On',
          type: 'time',
          order: 8,
        },
        modificationDate: {
          title: 'Modified On',
          type: 'time',
          order: 9,
        },
      },
    },
    senaiteReferringFacility: {
      list: false,
      order: 1,
      type: 'object',
      title: 'Senaite LIMS Referring Facility',
      properties: {
        contactFullName: {
          title: 'Contact Name',
          type: 'string',
          order: 0,
        },
        contactEmail: {
          title: 'Contact Email',
          type: 'string',
          order: 1,
        },
      },
    },
    senaiteSample: {
      list: false,
      order: 2,
      type: 'object',
      title: 'Senaite LIMS Sample',
      properties: {
        partitionId: {
          title: 'Sample Partition ID',
          type: 'string',
          order: 0,
        },
        appearance: {
          title: 'Appearance',
          type: 'string',
          order: 1,
        },
        appearanceRemarks: {
          title: 'Appearance Remarks',
          type: 'string',
          order: 2,
        },
        volume: {
          title: 'Volume',
          type: 'string',
          order: 3,
        },
        volumeRemarks: {
          title: 'Volume Remarks',
          type: 'string',
          order: 4,
        },
        dateReceived: {
          title: 'Date Received',
          type: 'time',
          order: 5,
        },
        receivedBy: {
          title: 'Received By',
          type: 'string',
          order: 6,
        },
        samplerEmail: {
          title: 'Sampler Email',
          type: 'string',
          order: 7,
        },
      },
    },
    senaiteResult: {
      list: false,
      order: 3,
      type: 'object',
      title: 'Senaite LIMS Result',
      properties: {
        title: {
          title: 'Test Type',
          type: 'string',
          order: 0,
        },
        retested: {
          title: 'Retested',
          type: 'number',
          order: 1,
        },
        result: {
          title: 'Selected Result',
          type: 'string',
          order: 2,
        },
        resultText: {
          title: 'Result Text',
          type: 'string',
          order: 3,
        },
        value: {
          title: 'Result Value',
          type: 'string',
          order: 4,
        },
        resultCaptureDate: {
          title: 'Capture date',
          type: 'time',
          order: 5,
        },
        remarks: {
          title: 'Remarks',
          type: 'string',
          order: 6,
        },
        unit: {
          title: 'Unit',
          type: 'string',
          order: 7,
        },
        pointOfCapture: {
          title: 'Point of Capture',
          type: 'string',
          order: 8,
        },
        manualEntryOfResults: {
          title: 'Sample Partition ID',
          type: 'string',
          order: 9,
        },
        instrument: {
          title: 'Instrument',
          type: 'string',
          order: 10,
        },
        instrumentEntryOfResults: {
          title: 'Entered by Instrument',
          type: 'number',
          order: 11,
        },
        hidden: {
          title: 'Hidden',
          type: 'number',
          order: 12,
        },
        hiddenManually: {
          title: 'Hidden Manually',
          type: 'number',
          order: 13,
        },
        analyst: {
          title: 'Analyst',
          type: 'string',
          order: 14,
        },
        verificators: {
          title: 'Verificators',
          type: 'string',
          order: 15,
        },
        testReviewState: {
          title: 'Test Review State',
          type: 'string',
          order: 16,
        },
        worksheetAnalysisReviewState: {
          title: 'Worksheet Analysis Review State',
          type: 'string',
          order: 17,
        },
        creator: {
          title: 'Created By',
          type: 'string',
          order: 18,
        },
        creationDate: {
          title: 'Created On',
          type: 'time',
          order: 19,
        },
        modificationDate: {
          title: 'Modified On',
          type: 'time',
          order: 20,
        },
      },
    },
  }

  const senaiteLimsPatientDataSchema = {
    id: {
      list: true,
      title: 'Patient ID',
      type: 'string',
      order: 0,
    },
    referringFacilityPatientName: {
      list: false,
      title: 'Patient Name from Referring Facility',
      type: 'string',
      order: 1,
    },
    referringFacilitySampleId: {
      list: false,
      title: 'Sample ID from Referring Facility',
      type: 'string',
      order: 2,
    },
  }

  const bdMgitGndResultCategories = [
    {
      name: 'Negative',
      i18nKey: 'resultCategoryNegative',
      externalId: 'Negative',
    },
    {
      name: 'Positive',
      i18nKey: 'resultCategoryPositive',
      externalId: 'Positive',
    },
    {
      name: 'Unknown',
      i18nKey: 'resultCategoryUnknown',
      externalId: 'Unknown',
    },
  ]

  const { id: bdMgitGndAssayId } = await knex('Assay')
    .where({
      externalId: 'assayBdMgitGnd',
    })
    .first('id')
  await Promise.each(bdMgitGndResultCategories, async resultCategory => {
    let { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', resultCategory.externalId).first()) || {}
    if (!resultCategoryId) {
      ;[resultCategoryId] = await knex('ResultCategory').insert(resultCategory)
    }
    const resultCategoryAssay = await knex('ResultCategoryAssay')
      .where('assayId', bdMgitGndAssayId)
      .andWhere('resultCategoryId', resultCategoryId)
      .first()
    if (!resultCategoryAssay) {
      await knex('ResultCategoryAssay').insert({
        assayId: bdMgitGndAssayId,
        resultCategoryId,
      })
    }
  })

  const { id: deviceTypeId } = await knex('DeviceType').where('externalId', 'SenaiteLims').first()
  const [assaySenaiteLimsSmearMicroscopyId] = await knex('Assay').insert({
    name: 'Senaite LIMS Smear Microscopy',
    i18nKey: 'assaySenaiteLIMSSmearMicroscopy',
    externalId: 'senaiteSmearMicroscopy',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId,
    resultCategory1Label: 'Result',
    resultCategory1Titlei18nKey: 'resultCategoryResult',
    resultSourceId: await resultSourceToId('LIMS'),
    patientDataSchema: JSON.stringify(senaiteLimsPatientDataSchema),
    resultDataSchema: JSON.stringify(senaiteLimsResultDataSchema),
    abbreviation: 'SL SM',
  })
  const smearMicroscopyResultCategories = [
    {
      name: 'Negative',
      i18nKey: 'resultCategoryNegative',
      externalId: 'Negative',
    },
    {
      name: 'Positive (+)',
      i18nKey: 'resultCategoryPositive1',
      externalId: 'Positive1',
    },
    {
      name: 'Positive (++)',
      i18nKey: 'resultCategoryPositive2',
      externalId: 'Positive2',
    },
    {
      name: 'Positive (+++)',
      i18nKey: 'resultCategoryPositive3',
      externalId: 'Positive3',
    },
    {
      name: 'Scanty (1-9/100)',
      i18nKey: 'resultCategoryScanty',
      externalId: 'Scanty',
    },
    {
      name: 'Unknown',
      i18nKey: 'resultCategoryUnknown',
      externalId: 'Unknown',
    },
  ]
  await Promise.each(smearMicroscopyResultCategories, async resultCategory => {
    let { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', resultCategory.externalId).first()) || {}
    if (!resultCategoryId) {
      ;[resultCategoryId] = await knex('ResultCategory').insert(resultCategory)
    }
    const resultCategoryAssay = await knex('ResultCategoryAssay')
      .where('assayId', assaySenaiteLimsSmearMicroscopyId)
      .andWhere('resultCategoryId', resultCategoryId)
      .first()
    if (!resultCategoryAssay) {
      await knex('ResultCategoryAssay').insert({
        assayId: assaySenaiteLimsSmearMicroscopyId,
        resultCategoryId,
      })
    }
  })

  const [assaySenaiteLimsTbCultureId] = await knex('Assay').insert({
    name: 'Senaite LIMS TB Culture',
    i18nKey: 'assaySenaiteLIMSTbCulture',
    externalId: 'senaiteTbCulture',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId,
    resultCategory1Label: 'Result',
    resultCategory1Titlei18nKey: 'resultCategoryResult',

    resultSourceId: await resultSourceToId('LIMS'),
    patientDataSchema: JSON.stringify(senaiteLimsPatientDataSchema),
    resultDataSchema: JSON.stringify(senaiteLimsResultDataSchema),
    abbreviation: 'SL TBC',
  })
  const tbCultureResultCategories = [
    {
      name: 'Contaminated',
      i18nKey: 'resultCategoryContaminated',
      externalId: 'Contaminated',
    },
    {
      name: 'Negative',
      i18nKey: 'resultCategoryNegative',
      externalId: 'Negative',
    },
    {
      name: 'Positive MOTT',
      i18nKey: 'resultCategoryPositiveMOTT',
      externalId: 'PositiveMOTT',
    },
    {
      name: 'Positive MTB',
      i18nKey: 'resultCategoryPositiveMTB',
      externalId: 'PositiveMTB',
    },
    {
      name: 'Unknown',
      i18nKey: 'resultCategoryUnknown',
      externalId: 'Unknown',
    },
  ]
  await Promise.each(tbCultureResultCategories, async resultCategory => {
    let { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', resultCategory.externalId).first()) || {}
    if (!resultCategoryId) {
      ;[resultCategoryId] = await knex('ResultCategory').insert(resultCategory)
    }
    const resultCategoryAssay = await knex('ResultCategoryAssay')
      .where('assayId', assaySenaiteLimsTbCultureId)
      .andWhere('resultCategoryId', resultCategoryId)
      .first()
    if (!resultCategoryAssay) {
      await knex('ResultCategoryAssay').insert({
        assayId: assaySenaiteLimsTbCultureId,
        resultCategoryId,
      })
    }
  })

  const [assaySenaiteLimsUnknownId] = await knex('Assay').insert({
    name: 'Senaite LIMS Unknown',
    i18nKey: 'assaySenaiteLIMSUnknown',
    externalId: 'senaiteUnknown',
    assayTypeId: await assayTypeToId('Unknown'),
    deviceTypeId,
    resultSourceId: await resultSourceToId('LIMS'),
    patientDataSchema: JSON.stringify(senaiteLimsPatientDataSchema),
    resultDataSchema: JSON.stringify(senaiteLimsResultDataSchema),
    abbreviation: 'SL UK',
  })
  const senaiteUnknownResultCategories = [
    {
      name: 'Unknown',
      i18nKey: 'resultCategoryUnknown',
      externalId: 'Unknown',
    },
  ]
  await Promise.each(senaiteUnknownResultCategories, async resultCategory => {
    let { id: resultCategoryId } =
      (await knex('ResultCategory').where('externalId', resultCategory.externalId).first()) || {}
    if (!resultCategoryId) {
      ;[resultCategoryId] = await knex('ResultCategory').insert(resultCategory)
    }
    const resultCategoryAssay = await knex('ResultCategoryAssay')
      .where('assayId', assaySenaiteLimsUnknownId)
      .andWhere('resultCategoryId', resultCategoryId)
      .first()
    if (!resultCategoryAssay) {
      await knex('ResultCategoryAssay').insert({
        assayId: assaySenaiteLimsUnknownId,
        resultCategoryId,
      })
    }
  })

  await Promise.each(assayExternalIds, async assayExternalId => {
    const { resultDataSchema: resultDataSchemaString, patientDataSchema: patientDataSchemaString } = await knex('Assay')
      .where('externalId', assayExternalId)
      .first('resultDataSchema', 'patientDataSchema')
    const resultDataSchema = JSON.parse(resultDataSchemaString || '{}')
    const patientDataSchema = JSON.parse(patientDataSchemaString || '{}')
    _.each(Object.keys(senaiteLimsResultDataSchema), senaiteLimsResultDataSchemaKey => {
      if (!resultDataSchema[senaiteLimsResultDataSchemaKey]) {
        const resultDataSchemaFields = Object.values(resultDataSchema)
        const resultDataSchemaFieldOrder = _.isEmpty(resultDataSchemaFields)
          ? 0
          : _.max(_.map(resultDataSchemaFields, 'order')) + 1
        resultDataSchema[senaiteLimsResultDataSchemaKey] = _.assign(
          {},
          senaiteLimsResultDataSchema[senaiteLimsResultDataSchemaKey],
          { order: resultDataSchemaFieldOrder }
        )
      }
    })
    _.each(Object.keys(senaiteLimsPatientDataSchema), senaiteLimsPatientDataSchemaKey => {
      if (!patientDataSchema[senaiteLimsPatientDataSchemaKey]) {
        const patientDataSchemaFields = Object.values(patientDataSchema)
        const patientDataSchemaFieldOrder = _.isEmpty(patientDataSchemaFields)
          ? 0
          : _.max(_.map(patientDataSchemaFields, 'order')) + 1
        patientDataSchema[senaiteLimsPatientDataSchemaKey] = _.assign(
          {},
          senaiteLimsPatientDataSchema[senaiteLimsPatientDataSchemaKey],
          { order: patientDataSchemaFieldOrder }
        )
      }
    })
    await knex('Assay')
      .where('externalId', assayExternalId)
      .update({
        resultDataSchema: JSON.stringify(resultDataSchema),
        patientDataSchema: JSON.stringify(patientDataSchema),
      })
  })

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

module.exports = {
  seedSenaiteLimsAssays,
}
