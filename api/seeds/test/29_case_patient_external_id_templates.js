module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: covidAssayTypeId } = await knex('AssayType').where('externalId', 'covid19').first('id')
  const covid19AssayIds = await knex('Assay').where('assayTypeId', covidAssayTypeId).pluck('id')
  await knex('PartnerAssay').whereIn('assayId', covid19AssayIds).update({
    reliableCaseExternalIdTemplate: '{{coalesce result.formData.caseId result.data.caseId result.patient.caseId}}',
    reliablePatientExternalIdTemplate: '{{coalesce result.formData.patientId result.data.patientId result.patient.id}}',
  })

  const { id: abbottM2000DeviceTypeId } = await knex('DeviceType').where('externalId', 'AbbottM2000').first('id')
  const abbottM2000AssayIds = await knex('Assay').where('deviceTypeId', abbottM2000DeviceTypeId).pluck('id')
  await knex('PartnerAssay').whereIn('assayId', abbottM2000AssayIds).update({
    unreliableCaseExternalIdTemplate:
      "{{extractValueFromRegexCaptureGroup result.rawData expression='^O\\|\\d*\\|([^\\|;]+)\\|' groupNumber=1}}",
    unreliablePatientExternalIdTemplate:
      "{{extractValueFromRegexCaptureGroup result.rawData expression='^P\\|\\d*\\|([^\\|;]+)\\|' groupNumber=1}}",
  })
}
