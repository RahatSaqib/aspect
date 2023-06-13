module.exports = async (knex, partnerData, countryName) => {
  const now = new Date()

  const { id: partnerId } = await knex('Partner').where('externalId', partnerData.partner.externalId).first('id')

  // Fill DeviceConfiguration table
  if (partnerData.deviceConfiguration && partnerData.deviceConfiguration.length > 0) {
    const deviceConfigurations = partnerData.deviceConfiguration.map(async dc => {
      const { stateName = null, lgaName = null, deviceType, data } = dc

      const { id: geographyId } = await knex('Geography as g')
        .join('Country as c', 'c.id', 'g.countryId')
        .leftJoin('State as s', 's.id', 'g.stateId')
        .leftJoin('Lga as l', 'l.id', 'g.lgaId')
        .where('c.name', countryName)
        .andWhere('s.name', stateName)
        .andWhere('l.name', lgaName)
        .first('g.id')

      const { id: deviceTypeId } = await knex('DeviceType').where('name', deviceType).first('id')

      return {
        geographyId,
        deviceTypeId,
        partnerId,
        data,
        createdOn: now,
        updatedOn: now,
      }
    })
    await knex('DeviceConfiguration').insert(await Promise.all(deviceConfigurations))
  }
}
