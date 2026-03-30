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

  await knex('Instrument')
    .update({ active: true })
    .whereExists(function () {
      this.select(1)
        .from('Result as r')
        .whereNotNull('r.instrumentSerial')
        .whereRaw('r.instrumentSerial = Instrument.serial')
        .whereRaw('r.deviceId = Instrument.deviceId')
        .whereNotExists(function () {
          this.select(1)
            .from('Result as newer')
            .join('Device as newerDevice', 'newerDevice.id', 'newer.deviceId')
            .join('DeviceType as newerDeviceType', 'newerDeviceType.id', 'newerDevice.deviceTypeId')
            .where('newerDeviceType.externalId', 'CepheidGeneXpert')
            .whereNotNull('newer.instrumentSerial')
            .whereRaw('newer.instrumentSerial = r.instrumentSerial')
            .where(function () {
              this.whereRaw('IFNULL(newer.endedOn, newer.startedOn) > IFNULL(r.endedOn, r.startedOn)')
              this.orWhere(function () {
                this.whereRaw('IFNULL(newer.endedOn, newer.startedOn) = IFNULL(r.endedOn, r.startedOn)')
                this.whereRaw('newer.id > r.id')
              })
            })
        })
    })
}
module.exports = { populateInstrumentTable }
