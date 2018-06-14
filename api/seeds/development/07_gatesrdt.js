module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  const existingDeviceType = await knex('DeviceType')
    .where({ externalId: 'CommCareGatesRDT' })
    .first('id')
  if (existingDeviceType) {
    return
  }

  const deviceTypeCategoryLab = await knex('DeviceTypeCategory')
    .where({ name: 'Lab' })
    .first('id')

  const resultSourceDiagnosticDevice = await knex('ResultSource')
    .where({ externalId: 'DiagnosticDevice' })
    .first('id')

  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'CommCareGatesRDT',
    name: 'CommCare Gates RDT',
    manufacturer: 'CommCare',
    deviceTypeCategoryId: deviceTypeCategoryLab.id,
    plugin: 'commcareGatesRdt',
  })

  const [assayTypeId] = await knex('AssayType').insert({
    name: 'CommCare RDT',
    i18nKey: 'assayTypeCommCareRDT',
  })

  await knex('Assay').insert({
    name: 'CommCare Gates RDT',
    i18nKey: 'assayCommCareGatesRDT',
    externalId: 'CommCareGatesRDT',
    assayTypeId,
    deviceTypeId,
    resultSourceId: resultSourceDiagnosticDevice.id,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: { list: true, type: 'string', title: 'Result' },
    }),
    patientDataSchema: JSON.stringify({
      name: { type: 'string', order: 1, title: 'Client Name' },
      age: { type: 'int', order: 2, title: 'Age' },
      gender: { type: 'string', order: 3, title: 'Gender' },
    }),
  })
}
