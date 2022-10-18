const upsertMGITDevices = require('./fixtures/insert_bdmgit_assay_and_devices')

module.exports = require('../utils').seed(knex => upsertMGITDevices(knex), __filename)
