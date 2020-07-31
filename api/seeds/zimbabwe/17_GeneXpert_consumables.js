module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

const { upsertConsumables } = require('../common')
const { unitToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  // ----------------------------------------
  // Add missing consumables for GeneXpert
  // ----------------------------------------
  const piece = await unitToId('Piece')
  const commonProps = {
    unit: piece,
    canExpire: 1,
    manufacturer: 'Cepheid',
    quantity: 1,
  }
  const data = [
    { consumableName: 'GeneXpert TB Cartridge', assayExternalId: 'GxMtbRif' },
    {
      consumableName: 'GeneXpert TB Ultra Cartridge',
      assayExternalId: 'GxMtbRifUltra',
    },
    { consumableName: 'GeneXpert Ebola Cartridge', assayExternalId: 'GxEbola' },
    {
      consumableName: 'Xpert HIV-1 Viral Load Cartridge',
      assayExternalId: 'GxHiv1Vl',
    },
    {
      consumableName: 'Xpert HIV-1 Qual Cartridge',
      assayExternalId: 'GxHiv1Qual',
    },
    {
      consumableName: 'Xpert HCV Viral Load Cartridge',
      assayExternalId: 'GxHcv',
    },
    {
      consumableName: 'GeneXpert COVID-19 Cartridge',
      assayExternalId: 'assayGXCovid19',
    },
  ]

  await Promise.each(data, ({ consumableName, assayExternalId }) =>
    upsertConsumables(knex, consumableName, assayExternalId, commonProps)
  )
}
