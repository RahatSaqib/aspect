const { upsertItems } = require('../utils')
const defaultFixture = require('../fixtures/Tags.json')

module.exports = async (knex, partnerName, fixture = defaultFixture) => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first('id')
  const tags = fixture.map(tag => {
    return {
    ...tag,
    partnerId
  }})
  await upsertItems(knex, 'Tag', 'title', tags)
}
