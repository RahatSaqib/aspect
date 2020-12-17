const chai = require('chai')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')

const { assert } = chai
const getClinicianAccessToken = () =>
  server
    .post('/api/auth')
    .send({
      name: 'clinician',
      password: 'test07',
      clientName: 'Mocha web',
    })
    .then(res => res.body.access)
const getAdminAccessToken = () =>
  server
    .post('/api/auth')
    .send({
      name: 'admin',
      password: 'test07',
      clientName: 'Mocha web',
    })
    .then(res => res.body.access)
describe('Result Comments', () => {
  const resultId = 1

  let commentId = null
  let text = 'Cough confirmed'
  let clinicianAccessToken = ''
  let adminAccessToken = ''
  before(() =>
    runTestWithKnex(async knex => {
      await knex('ResultNote').where('resultId', resultId).delete()

      clinicianAccessToken = await getClinicianAccessToken()
      adminAccessToken = await getAdminAccessToken()
    })
  )

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
    await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].noteType, 'Result FollowUp')

        commentId = res.body.data[0].id
      })
  })

  it('Should fail on retrieving comments of unknown resultId', async () => {
    await server
      .get(`/api/result/result-all-notes/99999999`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 404) // Not Found
      })
  })

  it('Should deny EDIT comment by non-author and non-admin', async () => {
    text += '!'
    const comment = {
      note: text,
      commentId,
    }
    await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)
      .then(res => {
        assert.equal(res.status, 403) // Forbidden
      })
  })

  it('Should EDIT comment by author', async () => {
    const comment = {
      note: text,
      commentId,
    }
    await server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].id, commentId)
      })
  })

  it('Should GET ALL comments of a particular resultId and return array with 1 comment', async () => {
    await server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].id, commentId)
      })
  })

  it('Should deny DELETE comment by non-author and non-admin', async () => {
    await server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)
      .then(res => {
        assert.equal(res.status, 403) // Forbidden
      })
  })

  it('Should DELETE comment and return list of remaining comments of a particular resultId', async () => {
    await server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assert.equal(res.body.data.length, 0)
      })
  })

  it('Should GET ALL comments of a particular resultId and return empty array', async () => {
    await server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assert.equal(res.body.data.length, 0)
      })
  })
})
