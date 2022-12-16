module.exports = async (knex, partnerData) => {
  const dbPartner = await knex('Partner').where({ name: partnerData.partnerName }).first()

  const defaultValues = {
    plugin: '',
    autoAcknowledgeOlderThanDays: null,
    numberToLeaveUnacknowledged: null,
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    dueDaysInventoryStockout: 30,
    dueDaysInventoryStockExpiring: 30,
  }

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
    partnerTypeId: finalValues.partnerTypeId,
  }

  if (!dbPartner) {
    const [partnerId] = await knex('Partner').insert(values)
    return partnerId
  }

  await knex('Partner').update(values).where({ name: partnerData.partnerName })
  return dbPartner.id
}
