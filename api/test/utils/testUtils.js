const supertest = require('supertest')
const config = require('../../src/config')

const server = supertest.agent(config.url)

module.exports = server
