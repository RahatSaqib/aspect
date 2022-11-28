module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

async function seed(knex) {
  const partners = await knex('Partner').select()
  const geographies = await knex('Geography').select()

  await Promise.all(
    _.map(
      ['Jennifer', 'Monica', 'Chandler', 'Joy', 'Kate', 'Ross', 'Lisa', 'Robin', 'Ted', 'Julius', 'Nicholas', 'Galit'],
      async name => {
        const lastPartnerId = _.sample(partners).id
        const lastCountryId = _.sample([1, 2, 3, 4])
        const timezone = _.sample([
          'South Africa Standard Time',
          'W. Central Africa Standard Time',
          'Eastern Standard Time',
          'Myanmar Standard Time',
        ])

        const culture = _.sample(['ny-MW', 'ig-NG', 'en-US'])
        const now = new Date()
        await knex('Person').insert({
          name,
          lastPartnerId,
          lastCountryId,
          timezone,
          culture,
          geographyId: _.sample(geographies).id,
          createdOn: now,
          updatedOn: now,
        })
      }
    )
  )
}
