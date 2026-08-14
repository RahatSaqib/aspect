const jwtDecode = require('jwt-decode')
const chai = require('chai')
const jwt = require('jsonwebtoken')
const uuid = require('node-uuid')
const bcrypt = require('bcrypt')

const config = require('../../src/config')
const shared = require('../utils/sharedToken')
const { clientTypes } = require('../../src/auth/service')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const server = require('../utils/testUtils')
const { convertTimezonetoIANA, convertTimezonetoWindowsIANA, arrayofIANATimezone } = require('../../src/shared/date')

const { assert } = chai

describe('Authentication routes', () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const noPermsUser = 'testuser'
  const noPermsPassword = 'test07'
  const authPath = '/api/auth'
  const webClientName = 'Mocha web'
  const webClientType = clientTypes.web
  const appClientName = 'Mocha app'
  const appClientType = clientTypes.reporter_app
  const trueConnectClientName = 'Mocha true connect'
  const trueConnectClientType = clientTypes.true_connect

  let jwToken
  let webToken
  let webClientId
  let appToken
  let appClientId

  const getToken = (clientName, clientType) =>
    server
      .post(authPath)
      .send({
        name: adminUsername,
        password: adminPassword,
        clientName,
        clientType,
      })
      .then(res => res.body)

  const daysToExpire = token => (token.expires - new Date()) / (1000 * 60 * 60 * 24)

  beforeEach(async () => {
    const webResponse = await getToken(webClientName, webClientType)
    const appResponse = await getToken(appClientName, appClientType)
    jwToken = webResponse.access
    shared.token = jwToken

    webToken = webResponse.refresh
    webClientId = webResponse.clientId
    appToken = appResponse.refresh
    appClientId = appResponse.clientId
  })
  afterEach(() =>
    runTestWithKnex(async knex => {
      await knex('LoginHistory').where('userId', '>', 0).del()
      await knex('RefreshToken').whereIn('clientName', [webClientName, appClientName, trueConnectClientName]).delete()
      await knex('LoginHistory').where('userId', '>', 0).del()
    })
  )

  describe('/api/auth', () => {
    before(async () => {
      shared.checkToken(server, authPath)

      await runTestWithKnex(async knex => {
        const lastPartnerId = 4
        const lastCountryId = 4

        const timezone = 'Myanmar Standard Time'

        const culture = 'en'
        const [id] = await knex('User').insert({
          name: noPermsUser.toLowerCase(),
          password: bcrypt.hashSync(noPermsPassword, saltRounds),
          legacyPassword: 0,
          approved: 1,
          lockedOut: 0,
          createdOn: new Date(),
          failedPasswordAttempts: 0,
        })

        await knex('Person').insert({
          userId: id,
          name: noPermsUser,
          lastPartnerId,
          lastCountryId,
          timezone,
          culture,
          createdOn: new Date(),
          updatedOn: new Date(),
          geographyId: 98,
          canLogIn: 1,
        })
      })
    })
    after(() =>
      runTestWithKnex(async knex => {
        await knex('RefreshToken').whereIn('clientId', ['123123123-123123123', '9999-9999']).delete()
        await knex('Person').where('name', noPermsUser).delete()
        await knex('LoginHistory').where('userId', '>', 0).del()
        await knex('User').where('name', noPermsUser).delete()
      })
    )

    describe('POST', () => {
      it('check timezone IANA is correct or not', async () => {
        runTestWithKnex(async knex => {
          await knex('LoginHistory').where('userId', '>', 0).del()
        })
        await server
          .post(authPath)
          .send({
            name: adminUsername,
            password: adminPassword,
            clientName: webClientName,
          })
          .then(res => {
            assert.equal(convertTimezonetoIANA(res.body.timezone), res.body.timezoneIANA)
          })
      })
    })

    describe('Timezone Aliases', () => {
      it('check timezone IANA aliases are for the same windows IANA timezone or not', async () => {
        const ianaTimezoneAliasesOne = 'Asia/Kolkata'
        const ianaTimezoneAliasesTwo = 'Asia/Calcutta'
        const windowsTimezone = 'India Standard Time'

        assert.equal(
          convertTimezonetoWindowsIANA(ianaTimezoneAliasesOne),
          convertTimezonetoWindowsIANA(ianaTimezoneAliasesTwo)
        )
        assert.equal(arrayofIANATimezone(windowsTimezone).includes(ianaTimezoneAliasesOne), true)
        assert.equal(arrayofIANATimezone(windowsTimezone).includes(ianaTimezoneAliasesTwo), true)
      })
    })

    describe('POST', () => {
      it('should return a JSON message that contains a valid jwt, access token, and client ID if username/password are correct', async () => {
        runTestWithKnex(async knex => {
          await knex('LoginHistory').where('userId', '>', 0).del()
        })
        await server
          .post(authPath)
          .send({
            name: adminUsername,
            password: adminPassword,
            clientName: webClientName,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isAbove(res.body.access.length, 100)
            assert.isAbove(res.body.refresh.length, 50)
            assert.isAbove(res.body.clientId.length, 32)
            jwt.verify(res.body.access, config.secret, (err, decoded) => {
              assert.isNotOk(err) // isNotOk = is falsy
              assert.property(decoded, 'name')
              assert.property(decoded, 'permissions')
              assert.property(decoded, 'clientType')
              assert.equal(decoded.clientType, webClientType)
              assert.property(decoded, 'iat')
              assert.property(decoded, 'exp')
              assert.property(decoded, 'iss')
            })
          })

        runTestWithKnex(async knex => {
          const lh = await knex('LoginHistory').where('username', adminUsername)
          assert.lengthOf(lh, 1)
          assert.equal(lh[0].success, 1)
        })
      })
      it('should only generate random clientId  if none is sent with the request', async () => {
        await server
          .post(authPath)
          .send({
            name: adminUsername,
            password: adminPassword,
            clientName: webClientName,
            clientId: webClientId,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isAbove(res.body.access.length, 100)
            assert.isAbove(res.body.refresh.length, 50)
            assert.isAbove(res.body.clientId.length, 32)
            assert.strictEqual(res.body.clientId, webClientId)
          })
        await server
          .post(authPath)
          .send({
            name: adminUsername,
            password: adminPassword,
            clientName: webClientName,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isAbove(res.body.access.length, 100)
            assert.isAbove(res.body.refresh.length, 50)
            assert.isString(res.body.clientId)
            assert.isAbove(res.body.clientId.length, 32)
          })
      })
      it('should return the appropriate license status for the user', () =>
        run(async () => {
          await server
            .post(authPath)
            .send({
              name: adminUsername,
              password: adminPassword,
              clientName: webClientName,
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
              assert.property(res.body, 'timezoneIANA')
              assert.property(res.body, 'countryAbbreviation')
              const jwtdecoded = jwtDecode(res.body.access)
              assert.property(jwtdecoded, 'hasToAcceptLicenseId')
              assert.isNull(jwtdecoded.hasToAcceptLicenseId)
              assert.property(jwtdecoded, 'clientType')
              assert.equal(jwtdecoded.clientType, webClientType)
            })
        }))
      it('should return 417 and error message if user has no permissions defined', () =>
        run(async () => {
          await server
            .post(authPath)
            .send({
              name: noPermsUser,
              password: noPermsPassword,
              clientName: webClientName,
              clientId: '9999-9999',
            })
            .then(res => {
              assert.equal(res.status, 417)
              assert.isString(res.body.message)
              assert.notEqual('', res.body.message)
            })
        }))

      it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for Reporter App', () =>
        runTestWithKnex(async knex => {
          const rt = await knex('RefreshToken').where('token', appToken).first()
          assert.equal(rt.clientName, appClientName)
          assert.equal(rt.clientType, appClientType)
          assert.closeTo(daysToExpire(rt), 30, 0.00001, 'Expiration days for app')
        }))

      it('should return a JSON message that contains a valid jwt, access token, and client ID with different expiration for web', () =>
        runTestWithKnex(async knex => {
          const rt = await knex('RefreshToken').where('token', webToken).first()
          assert.equal(rt.clientName, webClientName)
          assert.equal(rt.clientType, webClientType)
          assert.closeTo(daysToExpire(rt), 7, 0.00001, 'Expiration days for web')
        }))

      it('should treat true_connect like mobile for refresh token expiry and embed clientType in JWT', () =>
        runTestWithKnex(async knex => {
          const res = await server.post(authPath).send({
            name: adminUsername,
            password: adminPassword,
            clientName: trueConnectClientName,
            clientType: trueConnectClientType,
          })
          assert.equal(res.status, 200)
          const rt = await knex('RefreshToken').where('token', res.body.refresh).first()
          assert.equal(rt.clientType, trueConnectClientType)
          assert.closeTo(daysToExpire(rt), 30, 0.00001, 'Expiration days for true_connect')
          const jwtdecoded = jwtDecode(res.body.access)
          assert.equal(jwtdecoded.clientType, trueConnectClientType)
        }))
      it('should return 400 and error message if no user name is provided', async () => {
        await server
          .post(authPath)
          .send()
          .then(res => {
            assert.equal(res.status, 400)
            assert.isString(res.body.message)
            assert.notEqual('', res.body.message)
          })
      })

      it('should return 400 and error message if username is provided, but password is missing', async () => {
        await server
          .post(authPath)
          .send({ name: adminUsername })
          .then(res => {
            assert.equal(res.status, 400)
            assert.equal(res.body.message, '"password" is required')
          })
      })

      it('should return 400 and error message if user name and password is provided, but client name is missing', async () => {
        await server
          .post(authPath)
          .send({ name: adminUsername, password: adminPassword })
          .then(res => {
            assert.equal(res.status, 400)
            assert.equal(res.body.message, '"clientName" is required')
          })
      })

      it("should return 409 if user not found and GxAlert isn't available, or 401 if GxAlert is available but the user not found", async () => {
        await server
          .post(authPath)
          .send({
            name: 'MickeyMouse',
            password: adminPassword,
            clientName: webClientName,
          })
          .then(res => {
            // test returns 500 if its run offline
            assert.equal(res.status, 401)
          })
      })

      it('should return 401 and error message if incorrect password', async () => {
        runTestWithKnex(async knex => {
          await knex('LoginHistory').where('userId', '>', 0).del()
        })
        await server
          .post(authPath)
          .send({
            name: adminUsername,
            password: 'password',
            clientName: webClientName,
          })
          .then(res => {
            assert.equal(res.status, 401)
            assert.equal(res.body.message, 'Authentication failed. Wrong username or password.')
          })
        runTestWithKnex(async knex => {
          const lh = await knex('LoginHistory').where('username', adminUsername)
          assert.lengthOf(lh, 1)
          assert.equal(lh[0].success, 0)
          assert.equal(lh[0].code, 'wrong.password')
        })
      })
    })

    describe('GET', () => {
      it('should return 200 and welcome message when using valid token', async () => {
        await server
          .get(authPath)
          .set('Authorization', `Bearer ${jwToken}`)
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.message, 'Welcome to the API!')
          })
      })
    })
  })

  describe('POST to /refresh', () => {
    it('should return a JSON message that contains a valid jwt, access token, and client ID if clientId/refresh token are valid', async () => {
      await server
        .post(`${authPath}/refresh`)
        .send({ clientId: webClientId, token: webToken })
        .then(res => {
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
            assert.property(decoded, 'clientType')
            assert.equal(decoded.clientType, webClientType)
          })
        })
    })

    it('should return a JSON message with a token valid for approximately 7 days for web', () =>
      runTestWithKnex(async knex => {
        const newWebToken = await server
          .post(`${authPath}/refresh`)
          .send({ clientId: webClientId, token: webToken })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isAbove(res.body.refresh.length, 50)
            return res.body.refresh
          })
        const rt = await knex('RefreshToken').where('token', newWebToken).first()
        assert.equal(rt.clientName, webClientName)
        assert.equal(rt.clientType, webClientType)
        assert.closeTo(daysToExpire(rt), 7, 0.00001, 'Expiration for web after refresh')
      }))

    it('should return a JSON message with a token valid for approximately 30 days for reporter app', () =>
      runTestWithKnex(async knex => {
        const newAppToken = await server
          .post(`${authPath}/refresh`)
          .send({
            clientId: appClientId,
            token: appToken,
            clientType: appClientType,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isAbove(res.body.refresh.length, 50)
            assert.isNull(res.body.deviceTokenId)
            return res.body.refresh
          })
        const rt = await knex('RefreshToken').where('token', newAppToken).first()
        assert.equal(rt.clientName, appClientName)
        assert.equal(rt.clientType, appClientType)
        assert.isNull(rt.deviceTokenId)
        assert.closeTo(daysToExpire(rt), 30, 0.00001, 'Expiration for app after refresh')
      }))

    it('should store deviceTokenId for reporter app and return a JSON message with a deviceTokenId for reporter app', () =>
      runTestWithKnex(async knex => {
        const deviceTokenId = 'DEVICE_TOKEN_ID'
        const newAppToken = await server
          .post(`${authPath}/refresh`)
          .send({
            clientId: appClientId,
            token: appToken,
            clientType: appClientType,
            deviceTokenId,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.equal(res.body.deviceTokenId, deviceTokenId)
            return res.body.refresh
          })
        const rt = await knex('RefreshToken').where('token', newAppToken).first()
        assert.equal(rt.deviceTokenId, deviceTokenId)
      }))

    it('should store deviceTokenId for true_connect on refresh', () =>
      runTestWithKnex(async knex => {
        const login = await getToken(trueConnectClientName, trueConnectClientType)
        const deviceTokenId = 'TRUE_CONNECT_DEVICE_TOKEN'
        const res = await server.post(`${authPath}/refresh`).send({
          clientId: login.clientId,
          token: login.refresh,
          clientType: trueConnectClientType,
          deviceTokenId,
        })
        assert.equal(res.status, 200)
        const rt = await knex('RefreshToken').where('token', res.body.refresh).first()
        assert.equal(rt.deviceTokenId, deviceTokenId)
        const decoded = jwtDecode(res.body.access)
        assert.equal(decoded.clientType, trueConnectClientType)
      }))

    it('should not store deviceTokenId for web app and return a JSON message with deviceTokenId = null for web app', () =>
      runTestWithKnex(async knex => {
        const deviceTokenId = 'DEVICE_TOKEN_ID'
        const newAppToken = await server
          .post(`${authPath}/refresh`)
          .send({
            clientId: webClientId,
            token: webToken,
            clientType: webClientType,
            deviceTokenId,
          })
          .then(res => {
            assert.equal(res.status, 200)
            assert.isNull(res.body.deviceTokenId)
            return res.body.refresh
          })
        const rt = await knex('RefreshToken').where('token', newAppToken).first()
        assert.isNull(rt.deviceTokenId)
      }))

    it('should return 400 and error message if no client ID provided', async () => {
      await server
        .post(`${authPath}/refresh`)
        .send({
          token: webToken,
        })
        .then(res => {
          assert.equal(res.status, 400)
          assert.isString(res.body.message)
          assert.equal(res.body.message, '"clientId" is required')
        })
    })

    it('should return 400 and error message if client ID is provided, but token is missing', async () => {
      await server
        .post(`${authPath}/refresh`)
        .send({
          clientId: webClientId,
        })
        .then(res => {
          assert.equal(res.status, 400)
          assert.isString(res.body.message)
          assert.equal(res.body.message, '"token" is required')
        })
    })

    it('should return 400 and error message if invalid token or clientId', async () => {
      await server
        .post(`${authPath}/refresh`)
        .send({
          clientId: 'asdf',
          token: 'TOKEN',
        })
        .then(res => {
          assert.equal(res.status, 400)
          assert.equal(res.body.message, 'Unable to find token or token revoked')
        })
    })
  })
  describe('PUT to /update-login-details', () => {
    const path = `${authPath}/update-login-details`
    it('should allow users to login with their new username after they have changed it', async () => {
      const newUsername = 'new-username'
      await server
        .put(path)
        .send({
          currentPassword: adminPassword,
          clientName: webClientName,
          newUsername,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, newUsername)
          assert.deepEqual(res.body.data.changedFields, ['name'])

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')
          })
        })
      await server
        .post(authPath)
        .send({
          name: newUsername,
          password: adminPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          // get new token for changed credentials
          jwToken = res.body.access
          shared.token = res.body.access

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
          })
        })
      // Clean Up: Update the user with their old username again
      await server
        .put(path)
        .send({
          currentPassword: adminPassword,
          clientName: webClientName,
          newUsername: adminUsername,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, adminUsername)
          assert.deepEqual(res.body.data.changedFields, ['name'])
          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
          })
        })
      // ensure user can login with old credentials
      await server
        .post(authPath)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
        })
    })

    it('should allow users to login with their new password after they have changed it', async () => {
      const newPassword = '0mgIt5aP@ssw0rd!'

      await server
        .put(path)
        .send({
          currentPassword: adminPassword,
          clientName: webClientName,
          newPassword,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.deepEqual(res.body.data.changedFields, ['password'])

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')
          })
        })
      await server
        .post(authPath)
        .send({
          name: adminUsername,
          password: newPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          // get new token for changed credentials
          jwToken = res.body.access
          shared.token = res.body.access

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
          })
        })
      // Clean Up: Revert to previous password
      await server
        .put(path)
        .send({
          currentPassword: newPassword,
          clientName: webClientName,
          newPassword: adminPassword,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, adminUsername)
          assert.deepEqual(res.body.data.changedFields, ['password'])
          jwt.verify(res.body.access, config.secret, async (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
          })
        })
      // ensure user can login with old credentials
      await server
        .post(authPath)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
        })
    })
    it('should allow users to login with their new credentials after they have changed them', async () => {
      const newUsername = 'ChangedUsername'
      const newPassword = 'Th3Passw0rdAreDifferent'
      await server
        .put(path)
        .send({
          currentPassword: adminPassword,
          clientName: webClientName,
          newPassword,
          newUsername,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, newUsername)
          assert.deepEqual(res.body.data.changedFields, ['name', 'password'])

          jwt.verify(res.body.access, config.secret, async (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
            assert.property(decoded, 'permissions')
            assert.property(decoded, 'iat')
            assert.property(decoded, 'exp')
            assert.property(decoded, 'iss')
          })
        })
      await server
        .post(authPath)
        .send({
          name: newUsername,
          password: newPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
          assert.isAbove(res.body.access.length, 100)
          assert.isAbove(res.body.refresh.length, 50)
          assert.isAbove(res.body.clientId.length, 32)

          // get new token for changed credentials
          jwToken = res.body.access
          shared.token = res.body.access

          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, newUsername)
          })
        })
      // Clean Up: Revert to previous credentials
      await server
        .put(path)
        .send({
          currentPassword: newPassword,
          clientName: webClientName,
          newPassword: adminPassword,
          newUsername: adminUsername,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.isTrue(res.body.ok)
          assert.equal(res.body.data.username, adminUsername)
          assert.deepEqual(res.body.data.changedFields, ['name', 'password'])
          jwt.verify(res.body.access, config.secret, (err, decoded) => {
            assert.isNotOk(err) // isNotOk = is falsy
            assert.property(decoded, 'name')
            assert.equal(decoded.name, adminUsername)
          })
        })
      // ensure user can login with old credentials
      await server
        .post(authPath)
        .send({
          name: adminUsername,
          password: adminPassword,
          clientName: webClientName,
        })
        .then(res => {
          assert.equal(res.status, 200)
        })
    })

    it('should reject password changes when the current password is incorrect', async () => {
      await server
        .put(path)
        .send({
          currentPassword: 'Wr0ngP@ssw0rd!',
          clientName: webClientName,
          newPassword: 'An0therP@ssw0rd!',
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 403)
          assert.equal(res.body.message, 'Incorrect password.')
        })
    })
  })

  describe('PUT to /update-person-login-details', () => {
    it('should reject changing your own password without using update-login-details', async () => {
      const decoded = jwtDecode(shared.token)
      await server
        .put(`${authPath}/update-person-login-details/${decoded.personId}`)
        .send({
          canLogIn: true,
          newUsername: adminUsername,
          newPassword: 'BypassP@ssw0rd1',
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 403)
          assert.equal(res.body.message, 'Changing your own login details requires your current password')
        })
    })
  })

  describe('POST to /auth/send-reset-password-token', () => {
    const path = `${authPath}/send-reset-password-token/`

    it('should return an OK response regardless of whether the email address is valid or not', async () => {
      await server.post(`${path}brichards@systemone.id`).then(res => {
        assert.equal(res.status, 200)
        assert.isTrue(res.body.ok)
      })
      await server.post(`${path}invalid_email@example.com`).then(res => {
        assert.equal(res.status, 200)
        assert.isTrue(res.body.ok)
      })
    })
  })

  describe('PUT to /auth/update-password', () => {
    const path = `${authPath}/update-password/`

    it("should return a 404 response when token doesn't exist", async () => {
      await server
        .put(path + uuid.v4())
        .send({
          newPassword: 'NewPass123!',
          clientName: 'Mocha/Chai',
          clientId: 'Client ID',
        })
        .then(res => {
          assert.equal(res.status, 404)
          assert.equal(res.body.message, 'The reset password token was not found')
        })
    })
  })

  describe('GET to /auth/license', () => {
    const path = `${authPath}/license?licenseId=1`

    it('should return the license text for the given ID', async () => {
      await server
        .get(path)
        .set('Authorization', `Bearer ${jwToken}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          assert.property(res.body.data, 'createdOn')
          assert.property(res.body.data, 'content')
        })
    })
  })

  describe('POST to /auth/license', () => {
    const path = `${authPath}/license`

    it('should update the license accepted date for the user in the db and return a new JWT', async () => {
      await server
        .post(path)
        .set('Authorization', `Bearer ${jwToken}`)
        .send({
          licenseId: 1,
          clientId: webClientId,
          token: webToken,
        })
        .then(res => {
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
          })
        })
    })
  })
})
