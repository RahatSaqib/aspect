const chai = require('chai')

const server = require('../utils/testUtils')

const { assert } = chai
describe('Server Routes', () => {
  describe('/server', () => {
    const path = '/api/server'
    describe('GET', () => {
      it('should return a list of server by partner', done => {
        server.get(`${path}`).end((err, res) => {
          assert.isNotNull(res.body.data)
          assert.isAbove(res.body.data.length, 1)
          assert.typeOf(res.body.data, 'Array')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'serverUrl')

          done()
        })
      })
    })
  })
})
