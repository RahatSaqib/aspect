const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert, expect } = chai.use(chaiSubset)
const path = '/api/geography/lgas'

describe('POST', () => {
  const newName = 'newName'
  const stateName = 'Alabama'
  const lgasToDelete = []
  before(() => shared.checkToken(server, path))

  after(async () => {
    return run(async knex => {
      await knex('Geography').whereIn('lgaId', lgasToDelete).del()
      await knex('Lga').whereIn('id', lgasToDelete).del()
    })
  })

  describe('/lgas', () => {
    it('Should create lga', async () => {
      const { id: stateId } = await knex('State').where('name', stateName).first()
      const res = await server
        .post(`${path}`)
        .send({ name: newName, stateId })
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 201)
      lgasToDelete.push(res.body.data.id)
      const createdLga = await knex('Lga').where({ id: res.body.data.id }).first()
      expect(createdLga).to.containSubset({
        id: res.body.data.id,
        name: newName,
      })
      chai.assert.instanceOf(createdLga.createdOn, Date)
      chai.assert.instanceOf(createdLga.updatedOn, Date)
    })

    it('If a lga with same name exists, returns 409 Conflict', async () => {
      const { id: stateId } = await knex('State').where('name', stateName).first()
      const dupLgaId = await knex('Lga').insert({ name: newName })
      lgasToDelete.push(dupLgaId)
      const res = await server
        .post(`${path}`)
        .send({ name: newName, stateId })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 409)
    })
  })
})
