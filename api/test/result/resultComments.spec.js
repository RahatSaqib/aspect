const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
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
      await knex('ResultNote')
        .where('resultId', resultId)
        .delete()

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

  it('Should ADD comment and return list of comments of a particular resultId', done => {
    const comment = {
      note: text,
      resultNoteType: 'ResultFollowUp',
    }
    server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].noteType, 'Result FollowUp')

        commentId = res.body.data[0].id

        done()
      })
  })

  it('Should fail on retrieving comments of unknown resultId', done => {
    server
      .get(`/api/result/result-all-notes/99999999`)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 404) // Not Found

        done()
      })
  })

  it('Should deny EDIT comment by non-author and non-admin', done => {
    text += '!'
    const comment = {
      note: text,
      commentId,
    }
    server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)
      .end((err, res) => {
        assert.equal(res.status, 403) // Forbidden

        done()
      })
  })

  it('Should EDIT comment by author', done => {
    const comment = {
      note: text,
      commentId,
    }
    server
      .post(`/api/result/result-note/${resultId}`)
      .send(comment)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].id, commentId)

        done()
      })
  })

  it('Should GET ALL comments of a particular resultId and return array with 1 comment', done => {
    server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assertCommentProps(res.body.data)
        assert.equal(res.body.data[0].text, text)
        assert.equal(res.body.data[0].id, commentId)

        done()
      })
  })

  it('Should deny DELETE comment by non-author and non-admin', done => {
    server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${clinicianAccessToken}`)
      .end((err, res) => {
        assert.equal(res.status, 403) // Forbidden

        done()
      })
  })

  it('Should DELETE comment and return list of remaining comments of a particular resultId', done => {
    server
      .delete(`/api/result/result-note/${resultId}/${commentId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assert.equal(res.body.data.length, 0)

        done()
      })
  })

  it('Should GET ALL comments of a particular resultId and return empty array', done => {
    server
      .get(`/api/result/result-all-notes/${resultId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')

        assert.property(res.body, 'data')
        assert.equal(res.body.data.length, 0)

        done()
      })
  })
})
