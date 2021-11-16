const _ = require('lodash')
const { format } = require('date-fns')
const Promise = require('bluebird')
const {
  assayTypeToId,
  assayToId,
  deviceTypeCategoryToId,
  resultSourceToId,
  resultCategoryToId,
} = require('../src/shared/dictionary')
const truenatDeviceTypes = require('./fixtures/truenatDevice/DeviceType.json')
const truenatAssays = require('./fixtures/truenatDevice/Assays.json')
const truenatPatientDataSchema = require('./fixtures/truenatDevice/PatientDataSchema.json')
const truenatResultDataSchema = require('./fixtures/truenatDevice/ResultDataSchema.json')
const {
  seedPartnerAssay,
  seedPartnerDisease,
} = require('./utils')

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
    const existingDeviceType = await knex('DeviceType')
      .where('externalId', truenatDeviceType.externalId)
      .first()
    if (!existingDeviceType) {
      const deviceTypeCategoryId = await deviceTypeCategoryToId(
        truenatDeviceType.deviceTypeCategoryId
      )
      const [createdDeviceTypeId] = await knex('DeviceType').insert({
        ...truenatDeviceType,
        deviceTypeCategoryId,
      })
      deviceTypeIds[truenatDeviceType.externalId] = createdDeviceTypeId
    } else {
      deviceTypeIds[truenatDeviceType.externalId] = existingDeviceType.id
    }
  })

  await Promise.each(assays, async truenatAssay => {
    const existingAssay = await knex('Assay')
      .where('externalId', truenatAssay.externalId)
      .first()
    if (!existingAssay) {
      const assayTypeId = await assayTypeToId(truenatAssay.assayTypeId)
      const deviceTypeId = deviceTypeIds[truenatAssay.deviceTypeId]
      const resultSourceId = await assayTypeToId(truenatAssay.resultSourceId)
      const [createdDeviceTypeId] = await knex('Assay').insert({
        patientDataSchema: JSON.stringify(defaultPatientDataSchema),
        resultDataSchema: JSON.stringify(defaultResultDataSchema),
        ...truenatAssay,
        assayTypeId,
        deviceTypeId,
        resultSourceId,
      })
    }
  })

  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const [deviceTypeBDMGITId] = await knex('DeviceType').insert({
    externalId: 'BDMGIT',
    name: 'BD MGIT',
    manufacturer: 'Becton Dickinson',
    deviceTypeCategoryId: labDeviceTypeCategoryId,
  })

  const assayBdMgitAst = {
    name: 'BD MGIT AST',
    abbreviation: 'MGIT AST',
    i18nKey: 'assayBdMgitAst',
    externalId: 'assayBdMgitAst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify(assayBdMgitAstResultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayBdMgitAstId } =
    (await knex('Assay').where('externalId', 'assayBdMgitAst').first('id')) ||
    {}
  if (!assayBdMgitAstId) {
    ;[assayBdMgitAstId] = await knex('Assay').insert({
      ...assayBdMgitAst,
      externalId: 'assayBdMgitAst',
    })
  } else {
    await knex('Assay').where('id', assayBdMgitAstId).update(assayBdMgitAst)
  }

  const values = await Promise.all([
    resultCategoryToId('Detected'),
    resultCategoryToId('NotDetected'),
    resultCategoryToId('Success'),
    resultCategoryToId('Missing'),
    resultCategoryToId('Error'),
    resultCategoryToId('Unknown'),
    resultCategoryToId('Susceptible'),
    resultCategoryToId('Resistant'),
  ])
  const resultCategoryId = await knex('ResultCategoryAssay')
    .where({ assayId: assayBdMgitAstId })
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
      assayId: assayBdMgitAstId,
    })
  )

  const assayBdMgitGnd = {
    name: 'BD MGIT GND',
    abbreviation: 'MGIT GND',
    i18nKey: 'assayBdMgitGnd',
    externalId: 'assayBdMgitGnd',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
    resultDataSchema: JSON.stringify(assayBdMgitGndResultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayBdMgitGndId } =
    (await knex('Assay').where('externalId', 'assayBdMgitGnd').first('id')) ||
    {}
  if (!assayBdMgitGndId) {
    ;[assayBdMgitGndId] = await knex('Assay').insert({
      ...assayBdMgitGnd,
      externalId: 'assayBdMgitGnd',
    })
  } else {
    await knex('Assay').where('id', assayBdMgitGndId).update(assayBdMgitGnd)
  }
  values.splice(-2, 2)
  const resultCategoryBdMgitGndId = await knex('ResultCategoryAssay')
    .where({ assayId: assayBdMgitGndId })
    .select('resultCategoryId')
  const valuesToInsert = _.filter(
    values,
    elem =>
      !_.includes(
        _.map(resultCategoryBdMgitGndId, category => category.resultCategoryId),
        elem
      )
  )
  await Promise.each(valuesToInsert, elem =>
    knex('ResultCategoryAssay').insert({
      resultCategoryId: elem,
      assayId: assayBdMgitGndId,
    })
  )

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

function getNewMgitResultData(isAST) {
  return {
    EMB: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    RIF: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    S: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    EM: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    RA: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    INH: {
      sirStatus: _.sample(['susceptible', 'resistant']),
      growthUnits: _.random(1, 1300),
      antibioticConcentration: `${_.random(1, 10)}.00`,
      antibioticConcentrationUnits: 'ug/ml',
    },
    protocolLength: 42,
    instrumentLocation: 'B/A03',
    isolateNumber: '1',
    senderName: '7 Loveton Circle',
    instrumentType: 'MGIT960',
    instrumentNumber: '13',
    versionNumber: 'V1.00',
    testId: !isAST ? 'MGIT_960_GND' : 'MGIT_960_AST',
    resultTypeCode: !isAST ? 'GND_MGIT' : 'AST_MGIT',
    preliminaryFinalStatus: 'P',
  }
}

async function upsertCultureAssays(
  knex,
  deviceTypeLIMSId,
  patientDataSchema = MGITPatientDataSchema,
  cultureResultDataSchema = AssayBdMgitGndResultDataSchema,
  dstResultDataSchema = AssayBdMgitAstResultDataSchema
) {
  const assayGenericDst = {
    name: 'TB DST',
    abbreviation: 'GENERIC DST',
    i18nKey: 'assayGenericDst',
    externalId: 'assayGenericDst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeLIMSId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'MTB',
    resultCategory1i18nKey: 'resultCategoryMTB',
    resultCategory2Label: 'Resistance',
    resultCategory2i18nKey: 'resultCategoryResistance',
    resultDataSchema: JSON.stringify(dstResultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenericDstId } =
    (await knex('Assay').where('externalId', 'assayGenericDst').first('id')) ||
    {}
  if (!assayGenericDstId) {
    ;[assayGenericDstId] = await knex('Assay').insert({
      ...assayGenericDst,
      externalId: 'assayGenericDst',
    })
  } else {
    await knex('Assay').where('id', assayGenericDstId).update(assayGenericDst)
  }

  const values = await Promise.all([
    resultCategoryToId('Detected'),
    resultCategoryToId('PositiveMTB'),
    resultCategoryToId('NotDetected'),
    resultCategoryToId('PositiveMOTT'),
    resultCategoryToId('Success'),
    resultCategoryToId('Missing'),
    resultCategoryToId('Error'),
    resultCategoryToId('Contaminated'),
    resultCategoryToId('Invalid'),
    resultCategoryToId('Unknown'),
    resultCategoryToId('Susceptible'),
    resultCategoryToId('Resistant'),
  ])
  const resultCategoryId = await knex('ResultCategoryAssay')
    .where({ assayId: assayGenericDstId })
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
      assayId: assayGenericDstId,
    })
  )

  const assayGenericCulture = {
    name: 'Culture',
    abbreviation: 'CULTURE',
    i18nKey: 'assayGenericCulture',
    externalId: 'assayGenericCulture',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeLIMSId,
    resultSourceId: await resultSourceToId('LIMS'),
    resultCategory1Label: 'Culture Result',
    resultCategory1i18nKey: 'resultCategoryCultureResult',
    resultCategory2Label: 'Final Result',
    resultCategory2i18nKey: 'resultCategoryFinalResult',
    resultDataSchema: JSON.stringify(cultureResultDataSchema),
    patientDataSchema: JSON.stringify(patientDataSchema),
  }
  let { id: assayGenericCultureId } =
    (await knex('Assay')
      .where('externalId', 'assayGenericCulture')
      .first('id')) || {}
  if (!assayGenericCultureId) {
    ;[assayGenericCultureId] = await knex('Assay').insert({
      ...assayGenericCulture,
      externalId: 'assayGenericCulture',
    })
  } else {
    await knex('Assay')
      .where('id', assayGenericCultureId)
      .update(assayGenericCulture)
  }
  values.splice(-2, 2)
  const resultCategoryCultureId = await knex('ResultCategoryAssay')
    .where({ assayId: assayGenericCultureId })
    .select('resultCategoryId')
  const valuesToInsert = _.filter(
    values,
    elem =>
      !_.includes(
        _.map(resultCategoryCultureId, category => category.resultCategoryId),
        elem
      )
  )
  await Promise.each(valuesToInsert, elem =>
    knex('ResultCategoryAssay').insert({
      resultCategoryId: elem,
      assayId: assayGenericCultureId,
    })
  )

  await knex('ResultCategoryAssay')
    .update({ requiresTreatment: 1 })
    .where({ resultCategoryId: await resultCategoryToId('PositiveMTB') })

  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}

module.exports = {
  upsertMGITDeviceTypeAndAssays,
  getMGITResultFromTBPositive,
  upsertCultureAssays,
}
