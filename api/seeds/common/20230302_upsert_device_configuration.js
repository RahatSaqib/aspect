module.exports = async (knex, partnerData) => {
  const now = new Date()

  const { id: partnerId } = await knex('Partner').where('externalId', partnerData.partner.externalId).first('id')

  // Fill DeviceConfiguration table
  if (partnerData.deviceConfiguration && partnerData.deviceConfiguration.length > 0) {
    const deviceConfigurations = partnerData.deviceConfiguration.map(async dc => {
      const { deviceType, data } = dc

      const { id: deviceTypeId } = await knex('DeviceType').where('name', deviceType).first('id')

      return {
        deviceTypeId,
        partnerId,
        data,
        createdOn: now,
        updatedOn: now,
      }
    })

    await knex.transaction(async knex => {
      await knex('DeviceConfiguration').where('partnerId', partnerId).delete()
      await knex('DeviceConfiguration').insert(await Promise.all(deviceConfigurations))
    })
  }
}
