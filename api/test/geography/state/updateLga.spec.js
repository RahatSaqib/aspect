const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../../utils/sharedToken')
const server = require('../../utils/testUtils')
const { knex } = require('../../../src/db')
const { run } = require('../../../src/db')

const { assert, expect } = chai.use(chaiSubset)
const path = '/api/geography/lgas'

describe('PUT', () => {
  const newName = 'newName'
  const stateName = 'Alabama'
  let stateId
  let lga
  const lgasToDelete = []
  before(() => shared.checkToken(server, path))
  beforeEach(async () => {
    return run(async knex => {
      const lgaId = await knex('Lga').insert({ name: 'oldLgaName' })
      const { id: countryId } = await knex('Country').where('name', 'United States').first()
      ;({ id: stateId } = await knex('State').where('name', stateName).first())
      await knex('Geography').insert({ countryId, stateId, lgaId })
      lgasToDelete.push(lgaId)
      lga = await knex('Lga').where({ id: lgaId }).first()
    })
  })

  afterEach(async () => {
    return run(async knex => {
      await knex('Geography').whereIn('lgaId', lgasToDelete).del()
      await knex('Lga').whereIn('id', lgasToDelete).del()
    })
  })

  describe('/lgas/{lgaId}', () => {
    it('Should update lga', async () => {
      const res = await server
        .put(`${path}/${lga.id}`)
        .send({ name: newName, stateId })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      const updatedLga = await knex('Lga').where({ id: lga.id }).first()
      expect(updatedLga).to.containSubset({
        id: lga.id,
        name: newName,
      })
      chai.assert.instanceOf(updatedLga.updatedOn, Date)
    })

    it('If a lga with same name exists, returns 409 Conflict', async () => {
      const dupLgaId = await knex('Lga').insert({ name: newName })
      lgasToDelete.push(dupLgaId)
      const res = await server
        .put(`${path}/${lga.id}`)
        .send({ name: newName, stateId })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
    })

    it('should throw error when lgas with same name exists in same state', async () => {
      const dupLgaId = await knex('Lga').insert({ name: newName })
      await knex('Geography').insert({ lgaId: dupLgaId, stateId })
      lgasToDelete.push(dupLgaId)
      const res = await server
        .put(`${path}/${dupLgaId}`)
        .send({ name: 'oldLgaName', stateId })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 409)
    })

    it('If Id does not exists, returns 404 Not found', async () => {
      const res = await server
        .put(`${path}/${999}`)
        .send({ name: newName, stateId })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 404)
    })
  })
})
