module.exports = async knex => {
  await knex('DeviceMaintenanceStatus')
    .where({ externalId: 'inactiveUnknown' })
    .update({
      name: 'No Tests Performed',
      i18nKey: 'inactiveNoTestsPerformed',
      externalId: 'inactiveNoTestsPerformed',
    })

  await knex('DeviceMaintenanceStatus')
    .where({ externalId: 'inactiveNoResultsReported' })
    .update({
      name: 'Unknown',
      i18nKey: 'inactiveUnknown',
      externalId: 'inactiveUnknown',
      manuallySet: false,
    })
}
