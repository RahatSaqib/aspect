/* eslint-disable import/no-dynamic-require */
const fixture = require(`./fixtures/partnerData`)
const upsertDeviceConfiguration = require('../common/20230302_upsert_device_configuration')

module.exports = require('../utils').seed(
  async knex => upsertDeviceConfiguration(knex, fixture, 'Tanzania'),
  __filename
)
