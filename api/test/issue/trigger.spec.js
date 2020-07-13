const supertest = require('supertest')
const chai = require('chai')

const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const shared = require('../utils/sharedToken')
const { factNewResultsAvailableCheck } = require('../../src/fact/actions')

const { assert } = chai
const server = supertest.agent('http://localhost:8080')

describe.only('Issue Trigger', () => {
  describe('issue type NewResultsAvailable', () => {
    const path = '/api/issue/trigger'
    let messageContext
    // shared.checkToken(server, path)

    before(async () => {
      messageContext = await createMessageContext()
      messageContext.bindActionCreators({ factNewResultsAvailableCheck })
    })

    it(`should trigger`, done => {
      const issueType = 'NewResultsAvailable'

      server
        .post(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          issueType,
        })
        .end(async (err, res) => {
          assert.equal(res.status, 200)

          const { ok, data = {} } = res.body
          assert.equal(ok, true)
          assert.equal(issueType, data.issueType)
          assert.equal(data.triggered, true)

          await waitForAction(factNewResultsAvailableCheck())
          await waitForIdle()

          done()
        })
    })
  })
})
