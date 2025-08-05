const assert = require('assert')
const { knex } = require('../../src/db')
const { insertSite } = require('../../src/site/common/db')
const server = require('../utils/testUtils')
const shared = require('../utils/sharedToken')

describe('Site Consumables Batch Update', () => {
  let siteId
  let consumableId1
  let consumableId2

  before(async () => {
    // Create a new test site
    const { geographyId } = await knex('Person').orderBy('id').first()
    const { id: partnerId } = await knex('Partner').first()

    const testSite = {
      name: 'Test Site for Batch Update',
      externalId: 'Test Site for Batch Update',
      partnerId,
      geographyId,
    }

    const [newSiteId] = await insertSite(knex, testSite)
    siteId = newSiteId

    // Get two test consumables
    const consumables = await knex('Consumable').select('id').limit(2)
    if (consumables.length < 2) throw new Error('Not enough consumables in test DB')
    consumableId1 = consumables[0].id
    consumableId2 = consumables[1].id
  })

  after(async () => {
    // Clean up
    await knex('SiteConsumable').where({ siteId }).del()
    await knex('Site').where({ id: siteId }).del()
  })

  it('Should add multiple consumables to a site', async () => {
    const response = await server
      .put(`/api/site/consumables/${siteId}`)
      .send({ consumableIds: [consumableId1, consumableId2] })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.ok, true)

    // Verify consumables were added
    const siteConsumables = await knex('SiteConsumable')
      .where({ siteId })
      .select('consumableId')
      .then(rows => rows.map(row => row.consumableId))

    assert.deepEqual(siteConsumables.sort(), [consumableId1, consumableId2].sort())
  })

  it('Should update consumables when some are removed', async () => {
    const response = await server
      .put(`/api/site/consumables/${siteId}`)
      .send({ consumableIds: [consumableId1] }) // Remove consumableId2
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.ok, true)

    // Verify only consumableId1 remains
    const siteConsumables = await knex('SiteConsumable')
      .where({ siteId })
      .select('consumableId')
      .then(rows => rows.map(row => row.consumableId))

    assert.deepEqual(siteConsumables, [consumableId1])
  })

  it('Should handle empty consumable list', async () => {
    const response = await server
      .put(`/api/site/consumables/${siteId}`)
      .send({ consumableIds: [] })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(response.status, 200)
    assert.equal(response.body.ok, true)

    // Verify all consumables were removed
    const siteConsumables = await knex('SiteConsumable').where({ siteId }).select('consumableId')

    assert.equal(siteConsumables.length, 0)
  })

  it('Should return 404 for non-existent site', async () => {
    const response = await server
      .put('/api/site/consumables/99999')
      .send({ consumableIds: [consumableId1] })
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(response.status, 404)
  })
})
