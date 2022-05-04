module.exports = async (knex, partnerData) => {
  const partner = await knex('Partner')
    .where({ name: partnerData.partnerName })
    .first()
  const {
    partnerName,
    plugin = '',
    autoAcknowledgeOlderThanDays = null,
    numberToLeaveUnacknowledged = null,
    deviceLogHistoryDays = 365,
    maxDaysDeviceOffline = 7,
    maxDaysDeviceNoResults = 14,
    dueDaysInventoryStockout = 30,
    dueDaysInventoryStockExpiring = 30,
    serverUrl = 'https://systemone.id',
    partnerTypeId = null,
  } = partnerData || partner
  if (!partner) {
    const [partnerId] = await knex('Partner').insert({
      name: partnerName,
      plugin,
      autoAcknowledgeOlderThanDays,
      numberToLeaveUnacknowledged,
      deviceLogHistoryDays,
      maxDaysDeviceOffline,
      maxDaysDeviceNoResults,
      dueDaysInventoryStockout,
      dueDaysInventoryStockExpiring,
      serverUrl,
      partnerTypeId,
    })
    return partnerId
  }
  await knex('Partner')
    .update({
      name: partnerName,
      plugin,
      autoAcknowledgeOlderThanDays,
      numberToLeaveUnacknowledged,
      deviceLogHistoryDays,
      maxDaysDeviceOffline,
      maxDaysDeviceNoResults,
      dueDaysInventoryStockout,
      dueDaysInventoryStockExpiring,
      serverUrl,
      partnerTypeId,
    })
    .where({ name: partnerData.partnerName })
  return partner.id
}
