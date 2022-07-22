module.exports = async knex => {
  const statusInactiveConnectivity = await knex('DeviceMaintenanceStatus')
    .where({ externalId: 'inactiveConnectivity' })
    .first()
  if (statusInactiveConnectivity) {
    const { id: inactiveConnectivityId } = statusInactiveConnectivity
    const { id: inactiveUnknownId } = await knex('DeviceMaintenanceStatus')
      .where({ externalId: 'inactiveUnknown' })
      .first()
    await knex('DeviceMaintenanceStatusLog')
      .where({ deviceMaintenanceStatusId: inactiveConnectivityId })
      .update({ deviceMaintenanceStatusId: inactiveUnknownId })
    await knex('DeviceMaintenanceStatus').where({ id: inactiveConnectivityId }).del()
  }

  await knex('DeviceMaintenanceStatus').where({ externalId: 'inactiveDecommissioned' }).update({ manuallySet: false })
}
