const Promise = require('bluebird')
const _ = require('Lodash')

module.exports = async (knex, countryId) => {
  const statesWithDuplicates = await knex('Geography as g')
    .join('State as st', 'g.stateId', 'st.id')
    .where('g.countryId', countryId)
    .select(
      { originalId: knex.raw('min(`st`.`id`) as `originalId`') },
      { numberOfIds: knex.raw('count(`st`.`id`)') },
      'st.name'
    )
    .groupBy('st.name')
    .having('numberOfIds', '>', 1)

  await Promise.each(statesWithDuplicates, async state => {
    const duplicateStateGeographies = await knex('Geography as g')
      .join('State as st', 'g.stateId', 'st.id')
      .where('g.countryId', countryId)
      .andWhere('g.stateId', '!=', state.originalId)
      .andWhere('st.name', state.name)
      .select('g.id', 'g.stateId')

    await knex('Geography')
      .whereIn(
        'id',
        _.uniq(
          duplicateStateGeographies
            .map(g => g.id)
        )
      )
      .update({ siteId: state.originalId })
  })

  const lgasWithDuplicates = await knex('Geography as g')
    .join('Lga as l', 'g.lgaId', 'l.id')
    .where('g.countryId', countryId)
    .select(
      { originalId: knex.raw('min(`l`.`id`) as `originalId`') },
      { numberOfIds: knex.raw('count(`l`.`id`)') },
      'g.stateId',
      'l.name'
    )
    .groupBy(['g.stateId', 'l.name'])
    .having('numberOfIds', '>', 1)

  await Promise.each(lgasWithDuplicates, async lga => {
    const duplicateLgaGeographies = await knex('Geography as g')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where('g.stateId', lga.stateId)
      .andWhere('g.lgaId', '!=', lga.originalId)
      .andWhere('l.name', lga.name)
      .select('g.id', 'g.lgaId')

    await knex('Geography')
      .whereIn(
        'id',
        _.uniq(
          duplicateLgaGeographies
            .map(g => g.id)
        )
      )
      .update({ lgaId: lga.originalId })
  })

  const duplicateGeographies = await knex('Geography as g')
    .where('g.countryId', countryId)
    .select(
      { originalId: knex.raw('min(`g`.`id`) as `originalId`') },
      { numberOfIds: knex.raw('count(`l`.`id`)') },
      'g.stateId',
      'g.lgaId'
    )
    .groupBy(['g.stateId', 'g.lgaId'])
    .having('numberOfIds', '>', 1)

  await Promise.each(duplicateGeographies, async geography => {
    const duplicateGeographIds = _.uniq(
      duplicateGeographies
        .filter(
          g =>
            g.stateId === geography.stateId &&
            g.lgaId === geography.lgaId &&
            g.id !== geography.originalId
        )
        .map(g => g.id)
    )

   await Promise.each([ 'Device','Target', 'Site', 'Result', 'Person', 'JobContext', 'Issue', 'DeviceConfiguration', 'DeviceApiKey' ], table => knex(table)
      .whereIn('geographyId', duplicateGeographIds)
      .update({ geographyId: geography.originalId })
)

    await knex('Geography').whereIn('id', duplicateGeographIds).delete()
  })
}
