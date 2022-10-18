module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')

async function seed(knex) {
  const { id: countryId } = await knex('Country').where('name', 'Nigeria').first('id')

  // Get all the states including " State" in their name
  const currentStates = await knex('State as s')
    .innerJoin('Geography as g', 's.id', 'g.stateId')
    .where(knex.raw("s.name LIKE '% State'"))
    .andWhere('g.countryId', countryId)
    .select(['s.name', 's.id'])
    .distinct()

  await Promise.each(currentStates, async currState => {
    const actualStateName = currState.name.replace(' State', '')
    // Get the correct state, if exists
    const actualState = await knex('State as s')
      .leftJoin('Geography as g', 's.id', 'g.stateId')
      .where('name', actualStateName)
      .andWhere('g.countryId', countryId)
      .first('s.*')

    if (actualState) {
      // If actual state exists, then iterate over all the geographies for the current state
      const currGeographies = await knex('Geography').where({
        stateId: currState.id,
      })
      await Promise.each(currGeographies, async currGeography => {
        // Get the equivalent actual geography
        const actualGeography = await knex('Geography')
          .where('stateId', actualState.id)
          .andWhere(qb => {
            if (!currGeography.lgaId) {
              qb.whereNull('lgaId')
            } else {
              qb.where('lgaId', currGeography.lgaId)
            }
          })
          .first()

        if (actualGeography) {
          // If the equivalent actual geography exists, then update all the tables regs that refer to the current geography id, so they start referring to the actual one
          const tables = [
            'Device',
            'DeviceApiKey',
            'DeviceConfiguration',
            'Issue',
            'JobContext',
            'Person',
            'Result',
            'Site',
            'Target',
          ]
          await Promise.each(tables, async tbl =>
            knex(tbl).where({ geographyId: currGeography.id }).update({ geographyId: actualGeography.id })
          )
        } else {
          // IF the equivalent actual geography does not exist, then we should update the existing geography to be set to the actual state
          await knex('Geography').where({ id: currGeography.id }).update({ stateId: actualState.id })
        }
      })

      // The geographies that refers to the current state can be cleaned, as they aren't used anymore
      await knex('Geography').where('stateId', currState.id).delete()
      // And we can also remove the current state, as no geographies refer to it
      await knex('State').where('id', currState.id).delete()
    } else {
      // If the correct state is not present, then we can just update the name of the current one
      await knex('State').where('id', currState.id).update('name', actualStateName)
    }
  })
}
