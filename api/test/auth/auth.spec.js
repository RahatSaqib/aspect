const jwtDecode = require('jwt-decode')
const supertest = require('supertest')
const chai = require('chai')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const config = require('../../src/config')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const bcrypt = require('bcrypt')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Authentication routes', () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const unlicensedUser = 'testuser'
  const unlicensedPassword = 'test07'
  let path = '/api/auth'
  let jwToken = ''
  let refreshToken = ''
  let clientId = ''

  describe('/api/auth', () => {
    before(async () =>
      runTestWithKnex(async knex => {
        const lastPartnerId = 4
        const lastCountryId = 4

        const timezone = 'Myanmar Standard Time'

        const culture = 'en'
        const [id] = await knex('User').insert({
          name: unlicensedUser.toLowerCase(),
          password: bcrypt.hashSync(unlicensedPassword, saltRounds),
          legacyPassword: 0,
          approved: 1,
          lockedOut: 0,
          createdOn: new Date(),
          failedPasswordAttempts: 0,
        })

        await knex('Person').insert({
          userId: id,
          name: unlicensedUser,
          lastPartnerId,
          lastCountryId,
          timezone,
          culture,
          createdOn: new Date(),
          updatedOn: new Date(),
          geographyId: 98,
        })
      })
    )
    after(async () =>
      runTestWithKnex(async knex => {
        await knex('RefreshToken')
          .whereIn('clientId', ['123123123-123123123', '9999-9999'])
          .delete()
        await knex('Person')
          .where('name', unlicensedUser)
          .delete()
        await knex('User')
          .where('name', unlicensedUser)
          .delete()
      })
    )

    describe('POST', () => {
      it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for Reporter App', async () =>
        runTestWithKnex(async knex => {
          const refreshToken = await server
            .post(path)
            .send({
              name: adminUsername,
              password: adminPassword,
              clientName: 'reporter_app',
              clientType: 'Moto g6',
              clientId: '123123123-123123123',
            })
            .then(res => {
              assert.equal(res.status, 200)
              assert.isAbove(res.body.access.length, 100)
              assert.isAbove(res.body.refresh.length, 50)
              assert.equal(res.body.clientId, '123123123-123123123')
              assert.property(res.body, 'culture')
              assert.property(res.body, 'displayPreferences')
              assert.property(res.body, 'timezone')
              const jwtdecoded = jwtDecode(res.body.access)
              assert.property(jwtdecoded, 'hasToAcceptLicenseId')
              assert.isNull(jwtdecoded.hasToAcceptLicenseId)
              return res.body.refresh
            })

          const rt = await knex('RefreshToken')
            .where('token', refreshToken)
            .first()
          const diffTime = rt.expires - new Date()
          const diffTimeDays = diffTime / (1000 * 60 * 60 * 24)
          assert.equal(rt.clientType, 'Moto g6')
          assert.closeTo(diffTimeDays, 30, 0.00001)
        }))

      it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for web', async () =>
        runTestWithKnex(async knex => {
          const refreshToken = await server
            .post(path)
            .send({
              name: unlicensedUser,
              password: unlicensedPassword,
              clientName: 'web',
              clientId: '9999-9999',
            })
            .then(res => {
              assert.equal(res.status, 200)
              assert.isAbove(res.body.access.length, 100)
              assert.isAbove(res.body.refresh.length, 50)
              assert.equal(res.body.clientId, '9999-9999')
              assert.property(res.body, 'culture')
              assert.property(res.body, 'displayPreferences')
              assert.property(res.body, 'timezone')
              const jwtdecoded = jwtDecode(res.body.access)
              assert.property(jwtdecoded, 'hasToAcceptLicenseId')
              assert.isNotNull(jwtdecoded.hasToAcceptLicenseId)

              return res.body.refresh
            })

          const rt = await knex('RefreshToken')
            .where('token', refreshToken)
            .first()
          const diffTime = rt.expires - new Date()
          const diffTimeDays = diffTime / (1000 * 60 * 60 * 24)
          assert.equal(rt.clientType, 'web')
          assert.equal(rt.clientName, 'web')
          assert.closeTo(diffTimeDays, 7, 0.00001, 'Expiration days errors')
        }))

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
