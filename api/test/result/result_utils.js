const { addMinutes, subDays, format: dateFormat } = require('date-fns')
const { knex } = require('../../src/db')
const { insertSite } = require('../../src/site/common/db')
const {
  allResultCategoryToId,
  deviceApprovalToId,
  deviceTypeToId,
  resultSourceToId,
  resultTypeToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')

function calculateDateForResult(withinLastXDays = 60) {
  const daysToSubtract = Math.ceil(Math.random() ** 4 * withinLastXDays)
  return subDays(new Date(), daysToSubtract)
}

async function createResult(
  partnerId,
  deviceTypeExternalId,
  sampleTypeExternalId,
  assayExternalId,
  userId,
  resultDetails = {},
  sampleDetails = {},
  createDeviceLogFromInstrument = false,
  withinLastXDays = 60
) {
  const deviceApprovalApprovedId = await deviceApprovalToId('approved')
  let device = await knex('DeviceType as dt')
    .join('Assay as a', 'dt.id', 'a.deviceTypeId')
    .join('Device as d', 'dt.id', 'd.deviceTypeId')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .leftOuterJoin(
      'DeviceMaintenanceStatusLog as deviceMaintenanceStatusLog',
      'd.deviceMaintenanceStatusLogId',
      'deviceMaintenanceStatusLog.id'
    )
    .leftOuterJoin(
      'DeviceMaintenanceStatus AS deviceMaintenanceStatus',
      'deviceMaintenanceStatusLog.deviceMaintenanceStatusId',
      'deviceMaintenanceStatus.id'
    )
    .where('dt.externalId', deviceTypeExternalId)
    .andWhere('a.externalId', assayExternalId)
    .andWhere('c.abbreviation', 'US')
    .andWhere('d.deviceApprovalId', deviceApprovalApprovedId)
    .first('d.*', 'deviceMaintenanceStatus.externalId as deviceMaintenanceStatusExternalId')
  if (!device) {
    const { id: geographyId } = await knex('Geography').whereNotNull('lgaId').first('id')
    const auditFields = {
      createdBy: userId,
      createdOn: new Date(),
      updatedBy: userId,
      updatedOn: new Date(),
    }
    const [siteId] = await insertSite(knex, {
      name: `Lab with ${deviceTypeExternalId}`,
      shortName: `${deviceTypeExternalId} Lab`,
      externalId: `${new Date().getTime()}`,
      partnerId,
      geographyId,
      ...auditFields,
    })
    const [deviceId] = await knex('Device').insert({
      partnerId,
      siteId,
      defaultReportableSiteId: siteId,
      deviceTypeId: await deviceTypeToId(deviceTypeExternalId),
      deviceApprovalId: deviceApprovalApprovedId,
      name: `Test ${deviceTypeExternalId} Device`,
      shortName: deviceTypeExternalId,
      ...auditFields,
    })
    device = await knex('Device').where('id', deviceId).first()
  } else if (device.deviceMaintenanceStatusExternalId === 'inactiveDecommissioned') {
    await knex('Device').where('id', device.id).update({ deviceMaintenanceStatusLogId: null })
    await knex('DeviceMaintenanceStatusLog').where('deviceId', device.id).del()
  }
  const site = await knex('Site').where('id', device.siteId).first()
  const randomDate = calculateDateForResult(withinLastXDays)
  const randomNumber = calculateDateForResult(withinLastXDays).getTime()

  const sampleTypeId = await sampleTypeToId(sampleTypeExternalId)
  const sample = {
    externalId: `${dateFormat(randomDate, 'yy')}/${randomNumber}`,
    collectedOn: calculateDateForResult(withinLastXDays),
    sampleTypeId,
    originSiteId: site.id,
    ...sampleDetails,
  }
  const assay = await knex('Assay').where('externalId', assayExternalId).first()
  ;[sample.id] = await knex('Sample').insert(sample)

  const resultSourceDiagnosticDeviceId = await resultSourceToId('DiagnosticDevice')
  const resultCategories = await allResultCategoryToId()
  const resultTypePatientId = await resultTypeToId('Patient')
  const [resultId] = await knex('Result').insert({
    externalId: `COVID-${randomNumber}`,
    assayId: assay.id,
    partnerId,
    siteId: site.id,
    reportableSiteId: site.id,
    deviceId: device.id,
    longitude: site.longitude,
    latitude: site.latitude,
    resultSourceId: resultSourceDiagnosticDeviceId,
    resultTypeId: resultTypePatientId,
    sampleId: sample.id,
    resultCategory1: resultCategories.Unknown,
    resultCategory2: resultCategories.Unknown,
    resultData: '{}',
    formData: '{}',
    patientData: '{}',
    startedOn: deviceTypeExternalId === 'Aspect' ? null : randomDate,
    endedOn: addMinutes(randomDate, 100),
    createdOn: addMinutes(randomDate, 120),
    updatedOn: addMinutes(randomDate, 180),
    createdBy: userId,
    updatedBy: userId,
    ...resultDetails,
  })
  if (createDeviceLogFromInstrument) {
    await knex('DeviceLog').insert({
      createdOn: randomDate,
      deviceConfigurationUpdated: 0,
      deviceApiKeyId: device.deviceApiKeyId,
      rawMessage: `Some raw message from ${device.name}`,
      resultId,
      senderIp: '127.0.0.1',
      source: device.name,
    })
  }
  return resultId
}

async function getResult(resultId) {
  return knex('Result').where('id', resultId).first()
}

module.exports = {
  calculateDateForResult,
  createResult,
  getResult,
}
