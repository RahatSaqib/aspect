module.exports = async (knex, partnerData) => {
  const dbPartner = await knex('Partner').where({ name: partnerData.partnerName }).first()
  const defaultValues = require('../fixtures/PartnerDataDefaultValues.json')

  const finalValues = { ...defaultValues, ...partnerData }

  const values = {
    name: finalValues.partnerName,
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
  }

  if (!dbPartner) {
    const [partnerId] = await knex('Partner').insert(values)
    return partnerId
  }

  await knex('Partner').update(values).where({ name: partnerData.partnerName })
  return dbPartner.id
}
