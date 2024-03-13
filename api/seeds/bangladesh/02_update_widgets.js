module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')
const _ = require('lodash')
const geography = require('./fixtures/geography.json')

async function seed(knex) {
  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, ['abbreviation', 'a3', 'culture'])
    return knex('Country').update(countryData).where('abbreviation', country.abbreviation)
  })
}
