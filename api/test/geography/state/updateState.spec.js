const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert, expect } = chai.use(chaiSubset)
const path = '/api/geography/states'

describe('PUT', () => {
  const newName = 'newName'
  const newAbbreviation = 'newAbbr'
  let state
  const statesToDelete = []
  before(() => shared.checkToken(server, path))
  before(async () => {
    return run(async knex => {
      const stateId = await knex('State').insert({ name: 'oldStateName', abbreviation: 'oldAbbr' })
      statesToDelete.push(stateId)
      state = await knex('State').where({ id: stateId }).first()
    })
  })

  after(async () => {
    return run(async knex => {
      await knex('State').whereIn('id', statesToDelete).del()
    })
  })

  describe.only('/states/{stateId}', () => {
    it('Should update state', async () => {
      const res = await server
        .put(`${path}/${state.id}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 204)
      const updatedState = await knex('State').where({ id: state.id }).first()
      expect(updatedState).to.containSubset({
        id: state.id,
        name: newName,
        abbreviation: newAbbreviation,
      })
      chai.assert.instanceOf(updatedState.updatedOn, Date)
    })

    it('If a state with same name of abbreviation exists, returns 409 Conflict', async () => {
      const dupStateId = await knex('State').insert({ name: newName, abbreviation: newAbbreviation })
      statesToDelete.push(dupStateId)
      const res = await server
        .put(`${path}/${state.id}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 409)
    })

    it('If Id does not exists, returns 404 Not found', async () => {
      const res = await server
        .put(`${path}/${999}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 404)
    })
  })
})
