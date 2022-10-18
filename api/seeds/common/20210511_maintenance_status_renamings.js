module.exports = async knex => {
  // As we are always updating the fixture when a seeding is called, then we show the inactiveNoTestsPerformed status that is added
  // inactiveNoTestsPerformed should be the new renaming of inactiveUnknown
  await knex('DeviceMaintenanceStatus').where({ externalId: 'inactiveNoTestsPerformed' }).del()

  await knex('DeviceMaintenanceStatus').where({ externalId: 'inactiveUnknown' }).update({
    name: 'No Tests Performed',
    i18nKey: 'inactiveNoTestsPerformed',
    externalId: 'inactiveNoTestsPerformed',
  })

  await knex('DeviceMaintenanceStatus').where({ externalId: 'inactiveNoResultsReported' }).update({
    name: 'Unknown',
    i18nKey: 'inactiveUnknown',
    externalId: 'inactiveUnknown',
    manuallySet: false,
  })
}
