module.exports = require('../../src/db').seed(seed)

const { rowsAsObject } = require('../utils')

async function seed(knex) {
  const existingAssay = await knex('Assay')
    .where({ externalId: 'CommCareGatesRDT' })
    .first('id')
  if (existingAssay) {
    return
  }

  const [deviceTypes, resultSources, assayTypes] = await Promise.all([
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    rowsAsObject(knex, 'ResultSource', 'externalId'),
    rowsAsObject(knex, 'AssayType', 'name'),
  ])

  await knex('Assay').insert({
    name: 'CommCare Gates RDT',
    i18nKey: 'assayCommCareGatesRDT',
    externalId: 'CommCareGatesRDT',
    assayTypeId: assayTypes['HIV Qual'].id,
    deviceTypeId: deviceTypes.CommCareApp.id,
    resultSourceId: resultSources.DiagnosticDevice.id,
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
