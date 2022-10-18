const chai = require('chai')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const { getAccessToken } = require('../utils/authUtils')
const { createTestContext } = require('../deviceApi/utils')

const { assert } = chai
const context = createTestContext(knex, server, {
  user: 'admin',
  password: 'test07',
  partner: 'Partner One',
  type: 'CepheidGeneXpert', // = DeviceType.externalId
  sampleType: 'DBS',
  assayName: 'GxMtbRif',
})

describe('Result Comments', () => {
  let resultId = null

  let commentId = null
  let text = 'Cough confirmed'
  let clinicianAccessToken = ''
  let adminAccessToken = ''
  before(async () => {
    // create device and result with default props
    await context.createDeviceWithResult()
    resultId = context.resultId

    clinicianAccessToken = await getAccessToken('clinician', 'test07', 'Mocha web')
    adminAccessToken = await getAccessToken('admin', 'test07', 'Mocha web')
  })
  after(async () => {
    await context.cleanAll()
  })

  // helper func
  function assertCommentProps(data) {
    assert.equal(data.length, 1)
    assert.property(data[0], 'createdBy')
    assert.property(data[0], 'text')
    assert.property(data[0], 'noteType')
    assert.property(data[0], 'changedOn')
    assert.property(data[0], 'createdOn')
  }

  it('Should ADD comment and return list of comments of a particular resultId', async () => {
    const comment = {
      note: text,
      resultNoteType: 'ResultFollowUp',
    }
    const res = await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    assert.property(res.body, 'data')
    assertCommentProps(res.body.data)
    assert.equal(res.body.data[0].text, text)
    assert.equal(res.body.data[0].noteType, 'Result FollowUp')

    commentId = res.body.data[0].id
  })

  it('Should fail on retrieving comments of unknown resultId', async () => {
    const res = await server.get(`/api/result/result-all-notes/99999999`).set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 404) // Not Found
  })

  it('Should deny EDIT comment by non-author and non-admin', async () => {
    text += '!'
    const comment = {
      note: text,
      commentId,
    }
    const res = await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)

    /**
     * endpoint runs helper func getResultByResultId() to get result
     * and because requested result was created by admin and clinician
     * doesn't have access to it - constraints in helper func's query returns
     * no result, and because `result.ok = false` endpoint returns `notFound`.
     * See func addResultNote() in `src/result/service.js`
     */
    assert.equal(res.status, 404) // Not Found because of permission constraint
  })

  it('Should EDIT comment by author', async () => {
    const comment = {
      note: text,
      commentId,
    }
    const res = await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    assert.property(res.body, 'data')
    assertCommentProps(res.body.data)
    assert.equal(res.body.data[0].text, text)
    assert.equal(res.body.data[0].id, commentId)
  })

  it('Should GET ALL comments of a particular resultId and return array with 1 comment', async () => {
    const res = await server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    assert.property(res.body, 'data')
    assertCommentProps(res.body.data)
    assert.equal(res.body.data[0].text, text)
    assert.equal(res.body.data[0].id, commentId)
  })

  it('Should deny DELETE comment by non-author and non-admin', async () => {
    const res = await server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)

    /**
     * endpoint runs helper func getResultByResultId() to get result
     * and because requested result was created by admin and clinician
     * doesn't have access to it - constraints in helper func's query returns
     * no result, and because `result.ok = false` endpoint returns `notFound`.
     * See func deleteResultNote() in `src/result/service.js`
     */
    assert.equal(res.status, 404) // Not Found because of permission constraint
  })

  it('Should DELETE comment and return list of remaining comments of a particular resultId', async () => {
    const res = await server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    assert.property(res.body, 'data')
    assert.equal(res.body.data.length, 0)
  })

  it('Should GET ALL comments of a particular resultId and return empty array', async () => {
    const res = await server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    assert.property(res.body, 'data')
    assert.equal(res.body.data.length, 0)
  })
})
