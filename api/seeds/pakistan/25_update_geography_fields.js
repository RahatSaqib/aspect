const Promise = require('bluebird')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  /* Mapping devices provided by Mehdi in asp-2211 */
  /* Last two objects are get for Presons from GX Alert, geography ids where LGA is null */
  const map = [
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Khyber Pakhtunkhwa',
      oldLga: 'Mardan',
      newLga: 'Mardan',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Gujranwala',
      newLga: 'Gujranwala',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Hafizabad',
      newLga: 'Hafizabad',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Khanewal',
      newLga: 'Khanewal',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Mandi Bahauddin',
      newLga: 'Mandi Bahauddin',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Multan',
      newLga: 'Multan',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Okara',
      newLga: 'Okara',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Punjab',
      oldLga: 'Vehari',
      newLga: 'Vehari',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Sindh',
      oldLga: 'Khairpur',
      newLga: 'Khairpur',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Sindh',
      oldLga: 'Sanghar',
      newLga: 'Sanghar',
    },
    {
      oldState: 'Mercy Corps Sites',
      newState: 'Islamabad & CT',
      oldLga: null,
      newLga: 'Islamabad',
    },
    {
      oldState: 'Federally Administered TA',
      newState: 'Islamabad & CT',
      oldLga: null,
      newLga: 'Islamabad',
    },
  ]
  /* Tables containing geographyId as FK */
  const tables = [
    'Issue',
    'JobContext',
    'DeviceApiKey',
    'Target',
    'Person',
    'Site',
    'Result',
    'DeviceConfiguration',
    'Device',
  ]

  /* States have to removed from DB */
  const states4Delete = ['Federally Administered TA', 'Mercy Corps Sites']

  const getGeoBaseQuery = state =>
    knex('Geography').select('id').andWhere('stateId', knex('State').select('id').where('name', state)).first('id')

  const getGeo = (state, lga) =>
    getGeoBaseQuery(state).clone().andWhere('lgaId', 'in', knex('Lga').select('id').where('name', lga))

  const getGeoLgaNull = state => getGeoBaseQuery(state).clone().whereNull('lgaId')

  const updateTbl = (table, oldId, newId) => knex(table).where({ geographyId: oldId }).update({ geographyId: newId })

  /* Fix typo, according to https://en.wikipedia.org/wiki/Districts_of_Pakistan `Vihari` does not exist */
  await knex('Lga').where({ name: 'Vihari' }).update({ name: 'Vehari' })

  /* Update tables, replace old geographyId with new one */
  await Promise.each(map, async item => {
    const oldGeo = item.oldLga ? await getGeo(item.oldState, item.oldLga) : await getGeoLgaNull(item.oldState)
    const newGeo = await getGeo(item.newState, item.newLga)
    if (oldGeo && newGeo && oldGeo.id && newGeo.id) {
      await Promise.each(tables, async tbl => {
        await updateTbl(tbl, oldGeo.id, newGeo.id)
      })
    }
  })

  /* delete deprecated states and geography ids */
  await knex('Geography').whereIn('stateId', knex('State').select('id').whereIn('name', states4Delete)).delete()

  await knex('State').whereIn('name', states4Delete).delete()
}
