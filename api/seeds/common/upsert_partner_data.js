const lowerCase = require('lodash/lowerCase')

module.exports = async (knex, partnerData) => {
  const dbPartner = await knex('Partner').where({ externalId: partnerData.partner.externalId }).first()
  const defaultValues = require('../fixtures/PartnerDataDefaultValues.json')

  const finalValues = { ...defaultValues, ...partnerData }

  const values = {
    name: finalValues.partner.name,
    externalId: finalValues.partner.externalId,
    plugin: finalValues.plugin,
    autoAcknowledgeOlderThanDays: finalValues.autoAcknowledgeOlderThanDays,
    numberToLeaveUnacknowledged: finalValues.numberToLeaveUnacknowledged,
    deviceLogHistoryDays: finalValues.deviceLogHistoryDays,
    maxDaysDeviceOffline: finalValues.maxDaysDeviceOffline,
    maxDaysDeviceNoResults: finalValues.maxDaysDeviceNoResults,
    dueDaysInventoryStockout: finalValues.dueDaysInventoryStockout,
    dueDaysInventoryStockExpiring: finalValues.dueDaysInventoryStockExpiring,
    serverUrl: finalValues.serverUrl,
    apiUrl: finalValues.apiUrl,
    dueDaysCalibrationIssue: finalValues.dueDaysCalibrationIssue,
    partnerTypeId: finalValues.partnerTypeId,
    daysLimitToNotifyResults: finalValues.daysLimitToNotifyResults,
    hoursNotificationsShouldWaitForCustomFields: finalValues.hoursNotificationsShouldWaitForCustomFields,
    isDefault: finalValues.isDefault ?? true,
    excludePattern: finalValues.excludePattern,
  }

  if (!dbPartner) {
    const [partnerId] = await knex('Partner').insert(values)
    return partnerId
  }

  await knex('Partner')
    .update(values)
    .where({ externalId: partnerData.partner.externalId || lowerCase(partnerData.name) })
  return dbPartner.id
}
