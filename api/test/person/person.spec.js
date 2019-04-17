const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Person routes', () => {
  const path = '/api/person'
  describe('GET /person', () => {
    shared.checkToken(server, path)

    it('should return a list of persons when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 3)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'level')
          assert.property(res.body.data[0], 'state')
          assert.property(res.body.data[0], 'lga')
          assert.property(res.body, 'total')
          done()
        })
    })
  })

  describe('PUT', () => {
    let person
    let siteId
    before(async () =>
      run(async knex => {
        const dataConstraints = await getConstraints({ name: 'admin' })
        person = await getTestContact(knex, dataConstraints)
        siteId = await getTestSiteId(knex, dataConstraints)
      })
    )

    describe('/person/assign/{siteId}', () => {
      it('Should assign contact to site', done => {
        server
          .put(`${path}/assign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            res.body.data.some(contact =>
              expect(contact).to.have.property('id', person.id)
            )
            server
              .put(`${path}/assign/${siteId}`)
              .send({ id: person.id })
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, res) => {
                assert.equal(res.status, 409)
              })
            done()
          })
      })

      it('Should return 400 when a the ID of the user is not an integer', done => {
        server
          .put(`${path}/assign/${siteId}`)
          .send({ id: 'Invalid' })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 400)
            assert.typeOf(res.body, 'Object')
            done()
          })
      })

      it('Should return 404 when trying to assign a user that does not exit', done => {
        server
          .put(`${path}/assign/${siteId}`)
          .send({ id: '1000' })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.typeOf(res.body, 'Object')
            expect(res.body).to.include({
              statusCode: 404,
              error: 'Not Found',
              message: 'Not Found',
            })
            done()
          })
      })
    })

    describe('/person/unassign/{siteId}', () => {
      it('Should remove contact from site', () => {
        server
          .put(`${path}/unassign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
          })
      })
    })
  })
})

// -----------------------------------
// helper functions
// -----------------------------------
async function getTestSiteId(knex, dataConstraints) {
  const { id: siteId } = await knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
    .first('s.id')
  return siteId
}

async function getTestContact(knex, dataConstraints) {
  const person = await knex('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Job as j', 'p.id', 'j.personId')
    .leftJoin('JobContext as jc', 'jc.jobId', 'j.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
    })
    .first('p.id', 'j.id as jobId')
  return person
}
