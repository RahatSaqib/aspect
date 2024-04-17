const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert } = chai.use(chaiSubset)
const path = '/api/geography/lgas'

describe('DELETE', () => {
  const newName = 'newName'
  const newAbbreviation = 'newAbbr'
  const lgasToDelete = []
  before(() => shared.checkToken(server, path))

  after(async () => {
    return run(async knex => {
      await knex('Lga').whereIn('id', lgasToDelete).del()
    })
  })

  describe('/lgas/{lgaId}', () => {
    it('Should delete state', async () => {
      const [lgaId] = await knex('Lga').insert({ name: newName })
      lgasToDelete.push(lgaId)

      const res = await server.delete(`${path}/${lgaId}`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)

      const existingState = await knex('Lga').where({ id: lgaId }).first()
      assert.equal(existingState, undefined)
    })

    describe('If a lga with associated data exists, returns 409 Conflict', () => {
      let stateId
      let lgaId
      let geographyId
      let personId

      before(async () => {
        return run(async knex => {
          ;[lgaId] = await knex('Lga').insert({ name: newName })
          ;[stateId] = await knex('State').insert({ name: newName, abbreviation: newAbbreviation })
          ;[geographyId] = await knex('Geography').insert({ countryId: 1, stateId, lgaId })

          // Add associated data
          ;[personId] = await knex('Person').insert({
            geographyId,
            name: 'aspect-tester',
            culture: 'en-GB',
            createdOn: new Date(),
            updatedOn: new Date(),
            canLogIn: 0,
            disabled: 0,
          })
        })
      })

      after(async () => {
        return run(async knex => {
          await knex('Person').where('id', personId).delete()
          await knex('Geography').where('id', geographyId).delete()
          await knex('State').where('id', stateId).delete()
          await knex('Lga').where('id', lgaId).delete()
        })
      })

      it('If a lga with associated data exists, returns 409 Conflict', async () => {
        const res = await server.delete(`${path}/${lgaId}`).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 409)

        // Delete associated data
        await knex('Person').where('id', personId).delete()

        // Retry
        const res2 = await server.delete(`${path}/${lgaId}`).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res2.status, 200)
      })
    })
  })
})
