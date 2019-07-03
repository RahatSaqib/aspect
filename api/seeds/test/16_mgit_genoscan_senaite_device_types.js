module.exports = require('../utils').seed(seed, __filename)

const {
  assayTypeToId,
  resultSourceToId,
  deviceTypeCategoryToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId(
    'Information System'
  )

  let { id: deviceTypeBDMGITId } =
    (await knex('DeviceType')
      .where('externalId', 'BDMGIT')
      .first('id')) || {}
  if (!deviceTypeBDMGITId) {
    deviceTypeBDMGITId = await knex('DeviceType').insert({
      externalId: 'BDMGIT',
      name: 'BD MGIT',
      manufacturer: 'Becton Dickinson',
      deviceTypeCategoryId: labDeviceTypeCategoryId,
    })
  }

  const { id: deviceTypeHainGenoScanId } =
    (await knex('DeviceType')
      .where('externalId', 'HainGenoScan')
      .first('id')) || {}
  if (!deviceTypeHainGenoScanId) {
    await knex('DeviceType').insert({
      externalId: 'HainGenoScan',
      name: 'Hain GenoScan',
      manufacturer: 'Hain Lifescience',
      deviceTypeCategoryId: labDeviceTypeCategoryId,
    })
  }

  const { id: deviceTypeSenaiteLimsId } =
    (await knex('DeviceType')
      .where('externalId', 'SenaiteLims')
      .first('id')) || {}
  if (!deviceTypeSenaiteLimsId) {
    await knex('DeviceType').insert({
      externalId: 'SenaiteLims',
      name: 'Senaite LIMS',
      manufacturer: 'Senaite',
      deviceTypeCategoryId: informationSystemDeviceTypeCategoryId,
    })
  }

  const assayBdMgitAst = {
    name: 'BD MGIT AST',
    abbreviation: 'MGIT AST',
    i18nKey: 'assayBdMgitAst',
    externalId: 'assayBdMgitAst',
    assayTypeId: await assayTypeToId('TB AST'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
  }
  let { id: assayBdMgitAstId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitAst')
      .first('id')) || {}
  if (!assayBdMgitAstId) {
    assayBdMgitAstId = await knex('Assay').insert({
      ...assayBdMgitAst,
      externalId: 'assayBdMgitAst',
    })
  } else {
    await knex('Assay')
      .where('id', assayBdMgitAstId)
      .update(assayBdMgitAst)
  }

  const assayBdMgitGnd = {
    name: 'BD MGIT GND',
    abbreviation: 'MGIT GND',
    i18nKey: 'assayBdMgitGnd',
    externalId: 'assayBdMgitGnd',
    assayTypeId: await assayTypeToId('TB G&D'),
    deviceTypeId: deviceTypeBDMGITId,
    resultSourceId: await resultSourceToId('DiagnosticDevice'),
    resultCategory1Label: 'Result',
  }
  let { id: assayBdMgitGndId } =
    (await knex('Assay')
      .where('externalId', 'assayBdMgitGnd')
      .first('id')) || {}
  if (!assayBdMgitGndId) {
    assayBdMgitGndId = await knex('Assay').insert({
      ...assayBdMgitGnd,
      externalId: 'assayBdMgitGnd',
    })
  } else {
    await knex('Assay')
      .where('id', assayBdMgitGndId)
      .update(assayBdMgitGnd)
  }
}
