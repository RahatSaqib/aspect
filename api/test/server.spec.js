const supertest = require('supertest')
const chai = require('chai')

const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

describe('Base route', () => {
  it('should return 200 and "Hello! The API is at /api." in the root', (done) => {
    server
    .get('/')
    .end((err, res) => {
      assert.equal(res.status, 200)
      assert.equal(res.text, 'Hello! The API is at /api.')
      done()
    })
  })
})
