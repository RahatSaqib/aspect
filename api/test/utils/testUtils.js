const supertest = require('supertest')
const config = require('../../src/config')

module.exports = supertest.agent(config.url)
