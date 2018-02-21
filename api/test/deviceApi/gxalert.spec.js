const supertest = require('supertest')
const chai = require('chai')
const { createGxAlertTestContext } = require('./gxalert_utils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Device API routes for GxAlert Device', () => {
  const adminUsername = 'admin'
  const adminPassword = 'test07'

  describe('registration and configuration', () => {
    describe('when no device API key is specified', () => {
      const context = createGxAlertTestContext(server, {
        adminUsername,
        adminPassword,
      })

      const { runTest } = context

      it('should respond with UNAUTHORIZED', () =>
        runTest(async () => {
          const { basicDevicePayload } = context
          await server
            .post('/device')
            .set('Authorization', 'Bearer ')
            .send(basicDevicePayload)
            .then(res => {
              assert.equal(res.statusCode, 401)
            })
            .catch(assert.fail)
        }))
    })

    describe('when unknown device API key is specified', () => {
      const context = createGxAlertTestContext(server, {
        adminUsername,
        adminPassword,
      })

      const { runTest } = context

      it('should respond with UNAUTHORIZED', () =>
        runTest(async () => {
          const { basicDevicePayload } = context
          await server
            .post('/device')
            .set('Authorization', 'Bearer fg2g9cjx0njzgbfmkem0')
            .send(basicDevicePayload)
            .then(res => {
              assert.equal(res.statusCode, 401)
            })
            .catch(assert.fail)
        }))
    })
  })
})
