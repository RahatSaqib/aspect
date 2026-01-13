module.exports = require('../utils').seed(async knex => {
  // Initial instrument and module population seed
  await knex('Instrument').insert(function () {
    this.from('Device as d')
      .join('Result as r', 'd.id', 'r.deviceId')
      .whereNotNull('r.instrumentSerial')
      .groupBy('d.id', 'r.instrumentSerial')
      .select(
        knex.raw('0 as id'),
        'd.id as deviceId',
        'r.instrumentSerial as serial',
        knex.raw('null as macAddress'),
        knex.raw('now() as createdOn'),
        knex.raw('null as createdBy'),
        knex.raw('now() as updatedOn'),
        knex.raw('null as updatedBy')
      )
  })
}, __filename)
