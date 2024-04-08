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
  const newAbbreviation = 'newAbbr'
  let lga
  const lgasToDelete = []
  before(() => shared.checkToken(server, path))
  before(async () => {
    return run(async knex => {
      const lgaId = await knex('Lga').insert({ name: 'oldLgaName', abbreviation: 'oldAbbr' })
      lgasToDelete.push(lgaId)
      lga = await knex('Lga').where({ id: lgaId }).first()
    })
  })

  after(async () => {
    return run(async knex => {
      await knex('Lga').whereIn('id', lgasToDelete).del()
    })
  })

  describe.only('/lgas/{lgaId}', () => {
    it('Should update lga', async () => {
      const res = await server
        .put(`${path}/${lga.id}`)
        .send({ name: newName, abbreviation: newAbbreviation })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 204)
      const updatedLga = await knex('Lga').where({ id: lga.id }).first()
      expect(updatedLga).to.containSubset({
        id: lga.id,
        name: newName,
        abbreviation: newAbbreviation,
      })
      chai.assert.instanceOf(updatedLga.updatedOn, Date)
    })

    it('If a lga with same name of abbreviation exists, returns 409 Conflict', async () => {
      const dupLgaId = await knex('Lga').insert({ name: newName, abbreviation: newAbbreviation })
      lgasToDelete.push(dupLgaId)
      const res = await server
        .put(`${path}/${lga.id}`)
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
