const _ = require('lodash')

const { partnerName, adminUserName } = require('./fixtures/partnerData')
const { upsertNotificationTypes, getDefaultMessageTypes } = require('../utils')

module.exports = require('../utils').seed(async knex => {
  const { partnerId, adminId } = await knex('Partner as p')
    .join('Person as per', 'per.lastPartnerId', 'p.id')
    .join('User as u', 'u.id', 'per.userId')
    .where({ 'p.name': partnerName, 'u.name': adminUserName })
    .first('p.id as partnerId', 'per.userId as adminId')

  const { id: issueTypeId } = await knex('IssueType').where('externalId', 'HardwareTemperatureErrors').first('id')

  const issuesToRemoveTrigger = await knex('IssueType')
    .whereIn('externalId', [
      'externalId',
      'HardwareTemperatureDriftedFromSetPoint',
      'HardwareHeaterTemperatureDifferentialError',
      'HardwareThermistorTemperatureOutOfRange2014',
      'HardwareHeaterATemperatureUnstable',
      'HardwareHeaterBTemperatureUnstable',
      'HardwareThermistorTemperatureOutOfRange4017',
    ])
    .pluck('id')
  const jobFunctions = await knex('JobFunction')
    .whereIn('externalId', ['admin', 'systemOne', 'deviceMaker'])
    .pluck('id')
  await knex('NotificationType').update({ enabled: false }).whereIn('issueTypeId', issuesToRemoveTrigger)
  const defaultMessageTypes = await getDefaultMessageTypes(knex)
  const auditFields = {
    createdOn: new Date(),
    createdBy: adminId,
    updatedOn: new Date(),
    updatedBy: adminId,
  }
  await upsertNotificationTypes(
    knex,
    _.map(jobFunctions, jobFunctionId => ({
      name: 'Hardware Temperature Errors',
      partnerId,
      issueTypeId,
      jobFunctionId,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.HardwareTemperatureErrors.id,
      ...auditFields,
    }))
  )
}, __filename)
