const chai = require('chai')
const server = require('./utils/testUtils')

const { assert } = chai

describe('Base route', () => {
  it('should return 200 and display a message and version in the root', async () => {
    const { version: actualVersion } = require('../package.json')
    const {
      body: { message, version },
      status,
    } = await server.get('/')

    assert.equal(status, 200)
    assert.equal(message, 'Hello! The API is at /api.')
    assert.equal(version, actualVersion)
  })
})
