module.exports = async knex => {
  const statusInactiveConnectiviy = await knex('DeviceMaintenanceStatus')
    .where({ externalId: 'inactiveConnectivity' })
    .first()
  if (statusInactiveConnectiviy) {
    const { id: inactiveConnectivityId } = statusInactiveConnectiviy
    const { id: inactiveUnknownId } = await knex('DeviceMaintenanceStatus')
      .where({ externalId: 'inactiveUnknown' })
      .first()
    await knex('DeviceMaintenanceStatusLog')
      .where({ deviceMaintenanceStatusId: inactiveConnectivityId })
      .update({ deviceMaintenanceStatusId: inactiveUnknownId })
    await knex('DeviceMaintenanceStatus')
      .where({ id: inactiveConnectivityId })
      .del()
  }
}
