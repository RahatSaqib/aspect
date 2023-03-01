module.exports = async (knex, partnerData, countryName) => {
  const now = new Date()

  const { id: partnerId } = await knex('Partner').where('name', partnerData.partnerName).first('id')

  // Fill DeviceConfiguration table
  if (partnerData.deviceConfiguration && partnerData.deviceConfiguration.length > 0) {
    const deviceConfigurations = partnerData.deviceConfiguration.map(async dc => {
      const { id: geographyId } = await knex('Geography as g')
        .join('Country as c', 'c.id', 'g.countryId')
        .leftJoin('State as s', 's.id', 'g.stateId')
        .leftJoin('Lga as l', 'l.id', 'g.lgaId')
        .where('c.name', countryName)
        .andWhere('s.name', null)
        .andWhere('l.name', null)
        .first('g.id')

      const { id: deviceTypeId } = await knex('DeviceType').where('name', dc.deviceType).first('id')

      return {
        geographyId,
        deviceTypeId,
        partnerId,
        data: dc.data,
        createdOn: now,
        updatedOn: now,
      }
    })
    await knex('DeviceConfiguration').insert(await Promise.all(deviceConfigurations))
  }
}
