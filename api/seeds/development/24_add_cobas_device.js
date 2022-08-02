module.exports = require('../utils').seed(seed, __filename)
const _ = require('lodash')
const { allAssayTypeToId, allDeviceTypeCategoryToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { 'HIV VL': assayTypeHivVlId } = await allAssayTypeToId()

  const assay = _.omit(await knex('Assay').where('assayTypeId', assayTypeHivVlId).first(), ['id'])

  const { Lab: deviceTypeCategoryLab } = await allDeviceTypeCategoryToId()
  let { id: deviceTypeCobasId } = (await knex('DeviceType').where('externalId', 'COBAS4800').first('id')) || {}
  if (!deviceTypeCobasId) {
    ;[deviceTypeCobasId] = await knex('DeviceType').insert({
      externalId: 'COBAS4800',
      name: 'ROCHE COBAS 4800',
      manufacturer: 'Roche',
      deviceTypeCategoryId: deviceTypeCategoryLab,
    })
    await knex('Assay').insert({
      ...assay,
      deviceTypeId: deviceTypeCobasId,
      name: 'COBAS 4800 VL',
      externalId: 'assayCobasHivVl',
      i18nKey: 'assayCobasHivVl',
      abbreviation: 'Cobas Hiv VL',
    })
  }
}
