/* eslint-disable import/no-dynamic-require */
const fixture = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
const upsertDeviceConfiguration = require('../common/20230302_upsert_device_configuration')

module.exports = require('../utils').seed(
  async knex => upsertDeviceConfiguration(knex, fixture, 'United States'),
  __filename
)
