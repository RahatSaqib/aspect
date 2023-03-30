/* eslint-disable import/no-dynamic-require */
const fixture = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)
const upsertPartnerData = require('../common/upsert_partner_data')

module.exports = require('../utils').seed(async knex => upsertPartnerData(knex, fixture), __filename)
