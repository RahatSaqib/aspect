module.exports = require('../utils').seed(seed, __filename)

const { deviceTypeCategoryToId } = require('../../src/shared/dictionary')
const { upsertMGITDeviceTypeAndAssays, upsertCultureAssays } = require('../commonTB')

async function seed(knex) {
  const labDeviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const informationSystemDeviceTypeCategoryId = await deviceTypeCategoryToId('Information System')

  const { id: deviceTypeHainGenoScanId } =
    (await knex('DeviceType').where('externalId', 'HainGenoScan').first('id')) || {}
  if (!deviceTypeHainGenoScanId) {
    await knex('DeviceType').insert({
      externalId: 'HainGenoScan',
      name: 'Hain GenoScan',
      manufacturer: 'Hain Lifescience',
      deviceTypeCategoryId: labDeviceTypeCategoryId,
    })
  }

  let { id: deviceTypeSenaiteLimsId } = (await knex('DeviceType').where('externalId', 'SenaiteLims').first('id')) || {}
  if (!deviceTypeSenaiteLimsId) {
    ;[deviceTypeSenaiteLimsId] = await knex('DeviceType').insert({
      externalId: 'SenaiteLims',
      name: 'Senaite LIMS',
      manufacturer: 'Senaite',
      deviceTypeCategoryId: informationSystemDeviceTypeCategoryId,
    })
  }

  await upsertMGITDeviceTypeAndAssays(knex)
  await upsertCultureAssays(knex, deviceTypeSenaiteLimsId)
}
