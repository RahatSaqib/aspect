module.exports = require('../utils').seed(seed)

const _ = require('lodash')

async function seed(knex) {
  const persons = await knex('Person').select('id', 'lastPartnerId', 'name')

  await Promise.all(
    _.map(persons, async p => {
      const { id: licenseId } = await knex('License')
        .where('partnerId', p.lastPartnerId)
        .orWhere('partnerId', null)
        .orderBy('partnerId', 'desc')
        .orderBy('createdOn', 'desc')
        .first('id')
      await knex('LicensePerson').insert({
        personId: p.id,
        licenseId,
        ip: '127.0.0.1',
        acceptedOn: new Date(),
      })
    })
  )
}
