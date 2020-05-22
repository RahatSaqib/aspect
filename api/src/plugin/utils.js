const { knex } = require('../db')

async function getPartnerPluginName({ partnerId, caseId }) {
  let partnerPluginName = ''
  if (caseId) {
    ;[partnerPluginName] = await knex('PatientCase as c')
      .innerJoin('Result as r', 'c.id', 'r.patientCaseId')
      .leftJoin('Partner as p', 'r.partnerId', 'p.id')
      .where('c.id', caseId)
      .select('p.plugin')
      .pluck('p.plugin')
  } else if (partnerId) {
    ;[partnerPluginName] = await knex('Partner')
      .where('id', partnerId)
      .select('plugin')
      .pluck('plugin')
  }
  return partnerPluginName
}

async function getDeviceTypePluginName(deviceId) {
  const [deviceTypePluginName] = await knex('Device as d')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId || 0)
    .first('dt.plugin')
    .pluck('dt.plugin')
  return deviceTypePluginName
}

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
}
