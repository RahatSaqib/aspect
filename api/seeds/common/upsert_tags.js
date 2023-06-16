const { Promise } = require('bluebird')
const { upsertItems } = require('../utils')
const defaultFixture = require('../fixtures/Tags.json')

const references = {
  site: {
    column: 'siteId',
    table: 'SiteTag',
  },
  device: {
    column: 'deviceId',
    table: 'DeviceTag',
  },
  result: {
    column: 'resultId',
    table: 'ResultTag',
  },
  person: {
    column: 'personId',
    table: 'PersonTag',
  },
}

module.exports = async (knex, partnerExternalId, fixture = defaultFixture) => {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')
  const tags = fixture.map(({ title }) => {
    return {
      title,
      partnerId,
    }
  })
  await upsertItems(knex, 'Tag', ['title', 'partnerId'], tags)

  await Promise.each(fixture, async tag => {
    const { title, defaultIn } = tag
    const { id: tagId } = await knex('Tag').where({ title, partnerId }).first()
    await Promise.each(defaultIn, async refId => {
      const ref = references[refId]

      if (!ref)
        throw new Error(
          `${refId} is not a valid tag reference. It should be one of "site", "device", "result" or "person".`
        )

      const { column, table } = ref
      const defaultTagExists = await knex(table).whereRaw(`tagId = ? AND ${column} IS NULL`, [tagId]).first()

      if (!defaultTagExists) await knex(table).insert({ tagId })
    })
  })
}
