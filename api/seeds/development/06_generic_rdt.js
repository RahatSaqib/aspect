module.exports = require('../utils').seed(seed)
const {
  assayTypeToId,
  deviceTypeCategoryToId,
  resultSourceToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  // Skip this seed file if generic RDT device is already set up
  const existingGenericRdtDeviceType = await knex('DeviceType')
    .where({ externalId: 'GenericRDT' })
    .first('id')
  if (existingGenericRdtDeviceType) {
    return
  }

  const deviceTypeCategoryId = await deviceTypeCategoryToId('Lab')
  const assayTypeId = await assayTypeToId('Generic RDT')
  const resultSourceId = await resultSourceToId('DiagnosticDevice')

  // Generic RDT Device Type
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'GenericRDT',
    name: 'Generic RDT Reader',
    manufacturer: 'Generic Readers, Inc',
    deviceTypeCategoryId,
  })

  // Generic RDT Assay
  await knex('Assay').insert({
    name: 'Generic RDT',
    i18nKey: 'genericRdt',
    externalId: 'GenericRDT',
    assayTypeId,
    deviceTypeId,
    resultSourceId,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: { list: true, type: 'string', title: 'Result' },
    }),
    patientDataSchema: JSON.stringify({
      age: { type: 'int', order: 2, title: 'Age' },
      name: { type: 'string', order: 1, title: 'Client Name' },
      gender: { type: 'string', order: 3, title: 'Gender' },
    }),
  })
}
