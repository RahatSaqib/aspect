const supertest = require('supertest')
const chai = require('chai')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const config = require('../../src/config')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Authentication routes', () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'

  let path = '/api/auth'
  let jwToken = ''
  let refreshToken = ''
  let clientId = ''

  beforeEach(() => {
    path = '/api/auth'
  })

  describe('POST', () => {
    after(async () =>
      run(async knex => {
        knex('RefreshToken')
          .whereIn('clientId', ['123123123-123123123', '9999-9999'])
          .delete()
      })
    )
    it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for Reporter App', done => {
      server
        .post(path)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: 'Reporter App',
          clientType: 'Moto g6',
          clientId: '123123123-123123123',
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.equal(res.body.clientId, '123123123-123123123')
          assert.property(res.body, 'culture')
          assert.property(res.body, 'displayPreferences')
          assert.property(res.body, 'timezone')

          refreshToken = res.body.refresh
          run(async knex => {
            const result1 = await knex('RefreshToken')
              .where('token', refreshToken)
              .first()
            const diffTime = result1.expires - new Date()
            const diffTimeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            assert.equal(result1.clientType, 'Moto g6')
            assert.equal(diffTimeDays, 30)
          })

          done()
        })
    })
    it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for web', done => {
      server
        .post(path)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: 'Web',
          clientId: '9999-9999',
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.equal(res.body.clientId, '9999-9999')
          assert.property(res.body, 'culture')
          assert.property(res.body, 'displayPreferences')
          assert.property(res.body, 'timezone')

          refreshToken = res.body.refresh
          run(async knex => {
            const result1 = await knex('RefreshToken')
              .where('token', refreshToken)
              .first()
            const diffTime = result1.expires - new Date()
            const diffTimeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            assert.equal(result1.clientType, 'Web')
            assert.equal(result1.clientName, 'Web')
            assert.equal(diffTimeDays, 7)
          })

          done()
        })
    })
  })
  describe('POST', () => {
    it('should return 400 and error message if no user name is provided', done => {
      server
        .post(path)
        .send()
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.isString(res.body.message)
          assert.notEqual('', res.body.message)
          done()
        })
    })

    it('should return 400 and error message if user name is provided, but pw is missing', done => {
      server
        .post(path)
        .send({ name: adminUsername })
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.equal(
            res.body.message,
            'child "password" fails because ["password" is required]'
          )
          done()
        })
    })

    it('should return 400 and error message if user name and password is provided, but client name is missing', done => {
      server
        .post(path)
        .send({ name: adminUsername, password: 'password' })
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.equal(
            res.body.message,
            'child "clientName" fails because ["clientName" is required]'
          )
          done()
        })
    })

    it('should return 401 if user not found', done => {
      server
        .post(path)
        .send({
          name: 'MickeyMouse',
          password: 'password',
          clientName: 'Mocha/Chai',
        })
        .end((err, res) => {
          assert.equal(res.status, 401)
          done()
        })
    })

    it('should return 401 and error message if incorrect password', done => {
      server
        .post(path)
        .send({
          name: adminUsername,
          password: 'password',
          clientName: 'Mocha/Chai',
        })
        .end((err, res) => {
          assert.equal(res.status, 401)
          assert.equal(
            res.body.message,
            'Authentication failed. Wrong password.'
          )
          done()
        })
    })

    it('should return a JSON message that contains a valid jwt, access token, and client ID if username/password are correct', done => {
      server
        .post(path)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: 'Mocha/Chai',
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          // save token for the following tests:
          jwToken = res.body.access
          shared.token = jwToken
          refreshToken = res.body.refresh
          ;({ clientId } = res.body)

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            done()
          })
        })
    })
  })

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return 200 and welcome message when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${jwToken}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.body.message, 'Welcome to the API!')
          done()
        })
    })
  })

  describe('POST to /refresh', () => {
    it('should return 400 and error message if no client ID provided', done => {
      server
        .post(`${path}/refresh`)
        .send()
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.isString(res.body.message)
          assert.notEqual('', res.body.message)
          done()
        })
    })

    it('should return 400 and error message if client ID is provided, but token is missing', done => {
      server
        .post(`${path}/refresh`)
        .send({ clientId: 'Mocha/Chai' })
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.isString(res.body.message)
          assert.notEqual('', res.body.message)
          done()
        })
    })

    it('should return 400 and error message if invalid token or clientId', done => {
      server
        .post(`${path}/refresh`)
        .send({ clientId: 'asdf', token: 'TOKEN' })
        .end((err, res) => {
          assert.equal(res.status, 400)
          assert.equal(
            res.body.message,
            'Unable to find token or token revoked'
          )
          done()
        })
    })

    it('should return a JSON message that contains a valid jwt, access token, and client ID if clientId/refresh token are valid', done => {
      server
        .post(`${path}/refresh`)
        .send({ clientId, token: refreshToken })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          // save token for the following tests:
          jwToken = res.body.access

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            done()
          })
        })
    })
  })

  describe('PUT to /update-login-details', () => {
    beforeEach(() => {
      path = '/api/auth/update-login-details'
    })

    it('should allow users to login with their new username after they have changed it', done => {
      const newUsername = 'new-username'
      server
        .put(path)
        .send({
          currentPassword: adminPassword,
          newUsername: 'new-username',
          clientName: 'Mocha/Chai',
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, newUsername)
          assert.deepEqual(res.body.data.changedFields, ['name'])

          // save token for the following tests:
          jwToken = res.body.access
          shared.token = jwToken
          refreshToken = res.body.refresh
          ;({ clientId } = res.body)

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            server
              .post('/api/auth')
              .send({
                name: newUsername,
                password: adminPassword,
                clientName: 'Mocha/Chai',
              })
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isAbove(res.body.access.length, 100)
                assert.isAbove(res.body.refresh.length, 50)
                assert.isAbove(res.body.clientId.length, 32)

                // save token for the following tests:
                jwToken = res.body.access
                shared.token = jwToken
                refreshToken = res.body.refresh
                ;({ clientId } = res.body)

                jwt.verify(res.body.access, config.secret, (err, decoded) => {
                  assert.isNotOk(err) // isNotOk = is falsy
                  assert.property(decoded, 'name')
                  assert.equal(decoded.name, newUsername)
                  assert.property(decoded, 'permissions')
                  assert.property(decoded, 'iat')
                  assert.property(decoded, 'exp')
                  assert.property(decoded, 'iss')

                  // Clean Up: Update the user with their old username again
                  server
                    .put(path)
                    .send({
                      currentPassword: adminPassword,
                      newUsername: adminUsername,
                      clientName: 'Mocha/Chai',
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.isTrue(res.body.ok)
                      assert.equal(res.body.data.username, adminUsername)
                      assert.deepEqual(res.body.data.changedFields, ['name'])

                      // save token for the following tests:
                      jwToken = res.body.access
                      shared.token = jwToken
                      refreshToken = res.body.refresh
                      ;({ clientId } = res.body)

                      jwt.verify(
                        res.body.access,
                        config.secret,
                        (err, decoded) => {
                          assert.isNotOk(err) // isNotOk = is falsy
                          assert.property(decoded, 'name')
                          assert.equal(decoded.name, adminUsername)
                          assert.property(decoded, 'permissions')
                          assert.property(decoded, 'iat')
                          assert.property(decoded, 'exp')
                          assert.property(decoded, 'iss')

                          server
                            .post('/api/auth')
                            .send({
                              name: adminUsername,
                              password: adminPassword,
                              clientName: 'Mocha/Chai',
                            })
                            .end((err, res) => {
                              assert.equal(res.status, 200)
                              assert.isAbove(res.body.access.length, 100)
                              assert.isAbove(res.body.refresh.length, 50)
                              assert.isAbove(res.body.clientId.length, 32)

                              // save token for the following tests:
                              jwToken = res.body.access
                              shared.token = jwToken
                              refreshToken = res.body.refresh
                              ;({ clientId } = res.body)

                              jwt.verify(
                                res.body.access,
                                config.secret,
                                (err, decoded) => {
                                  assert.isNotOk(err) // isNotOk = is falsy
                                  assert.property(decoded, 'name')
                                  assert.equal(decoded.name, adminUsername)
                                  assert.property(decoded, 'permissions')
                                  assert.property(decoded, 'iat')
                                  assert.property(decoded, 'exp')
                                  assert.property(decoded, 'iss')

                                  done()
                                }
                              )
                            })
                        }
                      )
                    })
                })
              })
          })
        })
    })

    it('should allow users to login with their new password after they have changed it', done => {
      const newPassword = '0mgIt5aP@ssw0rd!'
      server
        .put(path)
        .send({
          currentPassword: adminPassword,
          newPassword,
          clientName: 'Mocha/Chai',
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, adminUsername)
          assert.deepEqual(res.body.data.changedFields, ['password'])

          // save token for the following tests:
          jwToken = res.body.access
          shared.token = jwToken
          refreshToken = res.body.refresh
          ;({ clientId } = res.body)

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            server
              .post('/api/auth')
              .send({
                name: adminUsername,
                password: newPassword,
                clientName: 'Mocha/Chai',
              })
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isAbove(res.body.access.length, 100)
                assert.isAbove(res.body.refresh.length, 50)
                assert.isAbove(res.body.clientId.length, 32)

                // save token for the following tests:
                jwToken = res.body.access
                shared.token = jwToken
                refreshToken = res.body.refresh
                ;({ clientId } = res.body)

                jwt.verify(res.body.access, config.secret, (err, decoded) => {
                  assert.isNotOk(err) // isNotOk = is falsy
                  assert.property(decoded, 'name')
                  assert.equal(decoded.name, adminUsername)
                  assert.property(decoded, 'permissions')
                  assert.property(decoded, 'iat')
                  assert.property(decoded, 'exp')
                  assert.property(decoded, 'iss')

                  // Clean Up: Update the user with their old username again
                  server
                    .put(path)
                    .send({
                      currentPassword: newPassword,
                      newPassword: adminPassword,
                      clientName: 'Mocha/Chai',
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.isTrue(res.body.ok)
                      assert.equal(res.body.data.username, adminUsername)
                      assert.deepEqual(res.body.data.changedFields, [
                        'password',
                      ])

                      // save token for the following tests:
                      jwToken = res.body.access
                      shared.token = jwToken
                      refreshToken = res.body.refresh
                      ;({ clientId } = res.body)

                      jwt.verify(
                        res.body.access,
                        config.secret,
                        (err, decoded) => {
                          assert.isNotOk(err) // isNotOk = is falsy
                          assert.property(decoded, 'name')
                          assert.equal(decoded.name, adminUsername)
                          assert.property(decoded, 'permissions')
                          assert.property(decoded, 'iat')
                          assert.property(decoded, 'exp')
                          assert.property(decoded, 'iss')

                          server
                            .post('/api/auth')
                            .send({
                              name: adminUsername,
                              password: adminPassword,
                              clientName: 'Mocha/Chai',
                            })
                            .end((err, res) => {
                              assert.equal(res.status, 200)
                              assert.isAbove(res.body.access.length, 100)
                              assert.isAbove(res.body.refresh.length, 50)
                              assert.isAbove(res.body.clientId.length, 32)

                              // save token for the following tests:
                              jwToken = res.body.access
                              shared.token = jwToken
                              refreshToken = res.body.refresh
                              ;({ clientId } = res.body)

                              jwt.verify(
                                res.body.access,
                                config.secret,
                                (err, decoded) => {
                                  assert.isNotOk(err) // isNotOk = is falsy
                                  assert.property(decoded, 'name')
                                  assert.equal(decoded.name, adminUsername)
                                  assert.property(decoded, 'permissions')
                                  assert.property(decoded, 'iat')
                                  assert.property(decoded, 'exp')
                                  assert.property(decoded, 'iss')

                                  done()
                                }
                              )
                            })
                        }
                      )
                    })
                })
              })
          })
        })
    })

    it('should allow users to login with their new credentials after they have changed them', done => {
      const newUsername = 'ChangedUsername'
      const newPassword = 'Th3Passw0rdAreDifferent'
      server
        .put(path)
        .send({
          currentPassword: adminPassword,
          newUsername,
          newPassword,
          clientName: 'Mocha/Chai',
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, newUsername)
          assert.deepEqual(res.body.data.changedFields, ['name', 'password'])

          // save token for the following tests:
          jwToken = res.body.access
          shared.token = jwToken
          refreshToken = res.body.refresh
          ;({ clientId } = res.body)

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            server
              .post('/api/auth')
              .send({
                name: newUsername,
                password: newPassword,
                clientName: 'Mocha/Chai',
              })
              .end((err, res) => {
                assert.equal(res.status, 200)
                assert.isAbove(res.body.access.length, 100)
                assert.isAbove(res.body.refresh.length, 50)
                assert.isAbove(res.body.clientId.length, 32)

                // save token for the following tests:
                jwToken = res.body.access
                shared.token = jwToken
                refreshToken = res.body.refresh
                ;({ clientId } = res.body)

                jwt.verify(res.body.access, config.secret, (err, decoded) => {
                  assert.isNotOk(err) // isNotOk = is falsy
                  assert.property(decoded, 'name')
                  assert.equal(decoded.name, newUsername)
                  assert.property(decoded, 'permissions')
                  assert.property(decoded, 'iat')
                  assert.property(decoded, 'exp')
                  assert.property(decoded, 'iss')

                  // Clean Up: Update the user with their old username again
                  server
                    .put(path)
                    .send({
                      currentPassword: newPassword,
                      newUsername: adminUsername,
                      newPassword: adminPassword,
                      clientName: 'Mocha/Chai',
                    })
                    .set('Authorization', `Bearer ${shared.token}`)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assert.isTrue(res.body.ok)
                      assert.equal(res.body.data.username, adminUsername)
                      assert.deepEqual(res.body.data.changedFields, [
                        'name',
                        'password',
                      ])

                      // save token for the following tests:
                      jwToken = res.body.access
                      shared.token = jwToken
                      refreshToken = res.body.refresh
                      ;({ clientId } = res.body)

                      jwt.verify(
                        res.body.access,
                        config.secret,
                        (err, decoded) => {
                          assert.isNotOk(err) // isNotOk = is falsy
                          assert.property(decoded, 'name')
                          assert.equal(decoded.name, adminUsername)
                          assert.property(decoded, 'permissions')
                          assert.property(decoded, 'iat')
                          assert.property(decoded, 'exp')
                          assert.property(decoded, 'iss')

                          server
                            .post('/api/auth')
                            .send({
                              name: adminUsername,
                              password: adminPassword,
                              clientName: 'Mocha/Chai',
                            })
                            .end((err, res) => {
                              assert.equal(res.status, 200)
                              assert.isAbove(res.body.access.length, 100)
                              assert.isAbove(res.body.refresh.length, 50)
                              assert.isAbove(res.body.clientId.length, 32)

                              // save token for the following tests:
                              jwToken = res.body.access
                              shared.token = jwToken
                              refreshToken = res.body.refresh
                              ;({ clientId } = res.body)

                              jwt.verify(
                                res.body.access,
                                config.secret,
                                (err, decoded) => {
                                  assert.isNotOk(err) // isNotOk = is falsy
                                  assert.property(decoded, 'name')
                                  assert.equal(decoded.name, adminUsername)
                                  assert.property(decoded, 'permissions')
                                  assert.property(decoded, 'iat')
                                  assert.property(decoded, 'exp')
                                  assert.property(decoded, 'iss')

                                  done()
                                }
                              )
                            })
                        }
                      )
                    })
                })
              })
          })
        })
    })
  })

  describe('POST to /auth/send-reset-password-token', () => {
    beforeEach(() => {
      path = '/api/auth/send-reset-password-token/'
    })

    it('should return an OK response regardless of whether the email address is valid or not', done => {
      server.post(`${path}brichards@systemone.id`).end((err, res) => {
        assert.equal(res.status, 200)
        assert.isTrue(res.body.ok)
        server.post(`${path}invalid_email@example.com`).end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          done()
        })
      })
    })
  })

  describe('PUT to /auth/update-password', () => {
    beforeEach(() => {
      path = '/api/auth/update-password/'
    })

    it("should return a 404 response when token doesn't exist", done => {
      server
        .put(path + uuid.v4())
        .send({
          newPassword: 'NewPass123!',
          clientName: 'Mocha/Chai',
          clientId: 'Client ID',
        })
        .end((err, res) => {
          assert.equal(res.status, 404)
          assert.equal(
            res.body.message,
            'The reset password token was not found'
          )
          done()
        })
    })
  })

  describe('GET to /auth/license', () => {
    beforeEach(() => {
      path = '/api/auth/license?licenseId=1'
    })

    it('should return the license text for the given ID', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${jwToken}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          assert.property(res.body.data, 'createdOn')
          assert.property(res.body.data, 'content')
          done()
        })
    })
  })

  describe('POST to /auth/license', () => {
    beforeEach(() => {
      path = '/api/auth/license'
    })

    it('should update the license accepted date for the user in the db and return a new JWT', done => {
      server
        .post(path)
        .set('Authorization', `Bearer ${jwToken}`)
        .send({
          licenseId: 1,
          clientId,
          token: refreshToken,
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')

            done()
          })
        })
    })
  })
})
