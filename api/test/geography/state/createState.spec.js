const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert, expect } = chai.use(chaiSubset)
const path = '/api/geography/states'

describe('POST', () => {
  const newName = 'newName'
  const newAbbreviation = 'newAbbr'
  const statesToDelete = []
  before(() => shared.checkToken(server, path))

  after(async () => {
    return run(async knex => {
      await knex('Geography').whereIn('stateId', statesToDelete).whereNull('lgaId').delete()
      await knex('State').whereIn('id', statesToDelete).del()
    })
  })

  describe('/states', () => {
    it('Should create state', async () => {
      const res = await server
        .post(`${path}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 201)
      statesToDelete.push(res.body.data.id)
      const createdState = await knex('State').where({ id: res.body.data.id }).first()
      expect(createdState).to.containSubset({
        id: res.body.data.id,
        name: newName,
        abbreviation: newAbbreviation,
      })
      chai.assert.instanceOf(createdState.createdOn, Date)
      chai.assert.instanceOf(createdState.updatedOn, Date)
    })

    it('If a state with same name exists, returns 409 Conflict', async () => {
      const dupStateId = await knex('State').insert({ name: newName, abbreviation: newAbbreviation })
      statesToDelete.push(dupStateId)
      const res = await server
        .post(`${path}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 409)
    })
  })
})
