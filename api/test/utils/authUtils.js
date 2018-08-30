const supertest = require('supertest')

const server = supertest.agent('http://localhost:8080')

module.exports = {
  async getAccessToken(username, password) {
    return server
      .post('/api/auth')
      .send({
        name: username,
        password,
        clientName: 'Mocha/Chai',
      })
      .then(res => res.body.access)
  },
}
