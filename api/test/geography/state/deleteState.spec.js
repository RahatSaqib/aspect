const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert } = chai.use(chaiSubset)
const path = '/api/geography/states'

describe('DELETE', () => {
  const newName = 'newName'
  const newAbbreviation = 'newAbbr'
  const statesToDelete = []
  before(() => shared.checkToken(server, path))

  after(async () => {
    return run(async knex => {
      await knex('State').whereIn('id', statesToDelete).del()
    })
  })

  describe('/states', () => {
    it('Should delete state', async () => {
      const [stateId] = await knex('State').insert({ name: newName, abbreviation: newAbbreviation })
      statesToDelete.push(stateId)

      const res = await server.delete(`${path}/${stateId}`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 204)

      const existingState = await knex('State').where({ id: stateId }).first()
      assert.equal(existingState, undefined)
    })

    describe('If a state with associated data exists, returns 409 Conflict', () => {
      let stateId
      let lgaId
      let geographyId

      before(async () => {
        return run(async knex => {
          ;[lgaId] = await knex('Lga').insert({ name: newName })
          ;[stateId] = await knex('State').insert({ name: newName, abbreviation: newAbbreviation })

          // Add associated data
          ;[geographyId] = await knex('Geography').insert({ countryId: 1, stateId, lgaId })
        })
      })

      after(async () => {
        return run(async knex => {
          await knex('Geography').where('id', geographyId).delete()
          await knex('State').where('id', stateId).delete()
          await knex('Lga').where('id', lgaId).delete()
        })
      })

      it('If a state with associated data exists, returns 409 Conflict', async () => {
        const res = await server.delete(`${path}/${stateId}`).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 409)

        // Delete associated data
        await knex('Geography').where('id', geographyId).delete()

        // Retry
        const res2 = await server.delete(`${path}/${stateId}`).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res2.status, 204)
      })
    })
  })
})
