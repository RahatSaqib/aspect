async function populateInstrumentTable(knex) {
  // Delete previous Instrument data to ensure a clean slate for population
  await knex('Instrument').delete()

  // Initial instrument and module population seed
  await knex('Instrument').insert(function () {
    this.from('Device as d')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('Result as r', 'd.id', 'r.deviceId')
      .where('dt.externalId', 'CepheidGeneXpert')
      .whereNotNull('r.instrumentSerial')
      .groupBy('d.id', 'r.instrumentSerial')
      .select(
        knex.raw('0 as id'),
        'd.id as deviceId',
        'r.instrumentSerial as serial',
        knex.raw('null as macAddress'),
        knex.raw('0 as active'),
        knex.raw('now() as createdOn'),
        knex.raw('null as createdBy'),
        knex.raw('now() as updatedOn'),
        knex.raw('null as updatedBy')
      )
  })

  const instrumentSerials = await knex('Instrument').groupBy('serial').pluck('serial')

  /* eslint-disable no-await-in-loop */
  for (const [index, instrumentSerial] of instrumentSerials.entries()) {
    // eslint-disable-next-line no-console
    console.log(`Processing instrumentSerial ${index + 1}/${instrumentSerials.length}: ${instrumentSerial}`)

    const latestInstrumentResult = await knex('Result as r')
      .join('Device as d', 'd.id', 'r.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .where('dt.externalId', 'CepheidGeneXpert')
      .where('r.instrumentSerial', instrumentSerial)
      .orderBy('endedOn', 'desc')
      .first('r.deviceId')

    if (latestInstrumentResult) {
      await knex('Instrument').update({ active: true }).where({
        deviceId: latestInstrumentResult.deviceId,
        serial: instrumentSerial,
      })
    }
  }
  /* eslint-enable no-await-in-loop */
}
module.exports = { populateInstrumentTable }
