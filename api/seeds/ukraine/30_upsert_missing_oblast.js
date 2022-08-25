const geography = require('./fixtures/geography.json')
const { upsertGeography } = require('../common')

module.exports = require('../utils').seed(async knex => upsertGeography(knex, geography), __filename)
