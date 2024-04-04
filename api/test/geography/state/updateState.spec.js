const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
// const { getUserByToken } = require('../utils/authUtils')

const { run } = require('../../../src/db')
// const { getConstraints, addConstraints } = require('../../src/auth/constraints')

const { assert, expect } = chai.use(chaiSubset)
const path = '/api/geography/states'

describe.only('PUT', () => {
  const newName = 'newName'
  const newAbbreviation = 'newAbbreviation'
  let state

  before(() => shared.checkToken(server, path))
  before(async () => {
    return run(async knex => {
      // const dataConstraints = await getConstraints({ name: 'admin' })
      const stateId = await knex('State').insert({ name: 'state', abbreviation: 'st' })
      state = await knex('State').where({ id: stateId }).first()
    })
  })

  after(async () => {
    return run(async knex => {
      await knex('State').where({ id: state.id }).del()
    })
  })

  describe('/states/{stateId}', () => {
    it.only('Should update state', async () => {
      const res = await server
        .put(`${path}/${state.id}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      const updatedState = await knex('State').where({ id: state.id }).first()
      assert.equal(res.status, 200)
      expect(updatedState).to.containSubset([{ id: state.id, name: newName, abbreviation: newAbbreviation }])
    })
  })
})
