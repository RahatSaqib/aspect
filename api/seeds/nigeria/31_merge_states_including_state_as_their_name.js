module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const { id: countryId } = await knex('Country')
    .where('name', 'Nigeria')
    .first('id')

  // Get all the states including " State" in their name
  const currentStates = await knex('State as s')
    .innerJoin('Geography as g', 's.id', 'g.stateId')
    .where(knex.raw("s.name LIKE '% State%'"))
    .andWhere('g.countryId', countryId)
    .select(['s.name', 'id'])
    .distinct()

  await Promise.each(currentStates, async currState => {
    const actualStateName = currState.name.replace(' State', '')
    // Get the correct state, if exists
    const actualState = await knex('State')
      .where('name', actualStateName)
      .first()

    if (actualState) {
      // If exists, then update the current geographies to refer to the actual state...
      await knex('Geography')
        .where('stateId', currState.id)
        .update('stateId', actualState.id)
      // ...and remove the current one
      await knex('State').where('id', currState.id).delete()
    } else {
      // If the correct state is not present, then update the name of the current one
      await knex('State')
        .where('id', currState.id)
        .update('name', actualStateName)
    }
  })
}
