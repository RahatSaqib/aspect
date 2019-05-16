module.exports = require('../utils').seed(seed)

const { deviceTypeCategoryToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId(
    'Information System'
  )

  const { id: deviceTypeBDMGITId } =
    (await knex('DeviceType')
      .where('externalId', 'BDMGIT')
      .first('id')) || {}
  if (!deviceTypeBDMGITId) {
    await knex('DeviceType').insert({
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
}
