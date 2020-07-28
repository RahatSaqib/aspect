module.exports = require('../utils').seed(seed, __filename)

const { getPermissionModules } = require('../utils')
const { upsertJobFunction } = require('../common')

const { unitToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Zimbabwe')
    .first('id')

  // ----------------------------------------
  // allow user to see InventoryStatus section which is protected by
  // 2 below permissions
  // ----------------------------------------
  const modules = await getPermissionModules(knex)
  await upsertJobFunction(knex, 'Admin', partnerId, [
    modules.dashboard.inventory,
    modules.inventory.edit,
  ])
  await upsertJobFunction(knex, 'Regional Officer', partnerId, [
    modules.dashboard.inventory,
    modules.inventory.edit,
  ])
  await upsertJobFunction(knex, 'Lab User', partnerId, [
    modules.dashboard.inventory,
    modules.inventory.view,
  ])

  // ----------------------------------------
  // Add missing consumables for GeneXpert
  // ----------------------------------------
  const piece = await unitToId('Piece')

  // get all Assays of GeneXpert
  const assayIds = await knex('Assay as a')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .select('a.id', 'a.i18nKey', 'a.externalId')

  // helper func to upsert data into Consumables and ConsumableAssay tables
  const upsertConsumables = async (name, externalId) => {
    const propsConsumables = {
      name,
      unit: piece,
      canExpire: 1,
      manufacturer: 'Cepheid',
    }
    let { id: consumableId } =
      (await knex('Consumable').where(propsConsumables).first()) || {}
    if (!consumableId) {
      ;[consumableId] = await knex('Consumable').insert(propsConsumables)
    }
    const propsConsumableAssay = {
      consumableId,
      assayId: assayIds.find(x => x.externalId === externalId).id,
      quantity: 1,
    }
    const consumableAssay = await knex('ConsumableAssay')
      .where(propsConsumableAssay)
      .first()
    if (!consumableAssay) {
      await knex('ConsumableAssay').insert(propsConsumableAssay)
    }
  }

  await upsertConsumables('GeneXpert TB Cartridge', 'GxMtbRif')
  await upsertConsumables('GeneXpert TB Ultra Cartridge', 'GxMtbRifUltra')
  await upsertConsumables('GeneXpert Ebola Cartridge', 'GxEbola')
  await upsertConsumables('Xpert HIV-1 Viral Load Cartridge', 'GxHiv1Vl')
  await upsertConsumables('Xpert HIV-1 Qual Cartridge', 'GxHiv1Qual')
  await upsertConsumables('Xpert HCV Viral Load Cartridge', 'GxHcv')
  await upsertConsumables('GeneXpert COVID-19 Cartridge', 'assayGXCovid19')
}
