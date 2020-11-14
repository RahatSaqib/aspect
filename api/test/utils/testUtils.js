const supertest = require('supertest')
const config = require('../../src/config')

const getServer = url => supertest.agent(url)
module.exports = getServer(config.url)
