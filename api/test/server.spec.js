const chai = require('chai')
const server = require('./utils/testUtils')

const { assert } = chai

describe('Base route', () => {
  it('should return 200 and "Hello! The API is at /api." in the root', async () => {
    const res = await server.get('/')
    assert.equal(res.status, 200)
    assert.equal(res.text, 'Hello! The API is at /api.')
  })
})
