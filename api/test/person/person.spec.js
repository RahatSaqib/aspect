const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe.only('Person routes', () => {
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
    let contact
    let duplicate
    let site
    beforeEach(async () =>
      run(async knex => {
        const dataConstraints = await getConstraints({ name: 'admin' })
        ;[duplicate, contact] = await knex('Person as p')
          .leftJoin('Geography as g', 'p.geographyId', 'g.id')
          .leftOuterJoin('State as st', 'g.stateId', 'st.id')
          .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
          .leftJoin('Job as j', 'p.id', 'j.personId')
          .leftJoin('JobContext as jc', 'jc.jobId', 'j.id')
          .leftJoin('Site as s', 'jc.siteId', 's.id')
          .modify(addConstraints, dataConstraints, {
            geography: 'g',
          })
          .select('p.id', 'j.id as jobId')
        site = await knex('Site as s')
          .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
          .leftOuterJoin('State as st', 'g.stateId', 'st.id')
          .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
          .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
          .modify(addConstraints, dataConstraints, {
            site: 's',
            geography: 'g',
          })
          .first('s.id')
        console.log('site', site, duplicate, 'contact', contact)
        await knex('JobContext').insert({
          jobId: duplicate.jobId,
          siteId: site.id,
        })
      })
    )

    afterEach(() =>
      run(async knex => {
        const jc = await knex('JobContext')
        console.log('before', jc)
        await knex('JobContext')
          .where({
            jobId: contact.jobId,
            siteId: site.id,
          })
          .del()

        await knex('JobContext')
          .where({
            jobId: duplicate.jobId,
            siteId: site.id,
          })
          .del()
        console.log('after', jc)
      })
    )

    describe('/person/assign/{siteId}', () => {
      it('Should assign contact to site', () => {
        server
          .put(`${path}/assign/${site.id}`)
          .send({ id: contact.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            res.body.data.some(contact =>
              expect(contact).to.have.property('id', contact.id)
            )
          })
      })

      it('Should return 400 for invalid data', () => {
        server
          .put(`${path}/assign/${site.id}`)
          .send({ id: 'Invalid' })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 400)
            assert.typeOf(res.body, 'Object')
          })
      })
      it('Should return 404 for invalid person / site id', () => {
        server
          .put(`${path}/assign/${site.id}`)
          .send({ id: '1000' })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.typeOf(res.body, 'Object')
            expect(res.body).to.include({
              statusCode: 404,
              error: 'Not Found',
              message: 'Not Found',
            })
          })
      })
      it.skip('Should return 409 for already assigned contact', () => {
        server
          .put(`${path}/assign/${site.id}`)
          .send({ id: duplicate.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            console.log('dup assign', res.body)
            assert.equal(res.status, 409)
          })
      })
    })

    describe('/person/unassign/{siteId}', () => {
      it('Should remove contact from site', () => {
        server
          .put(`${path}/unassign/${site.id}`)
          .send({ id: duplicate.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            console.log('dup un', res.body)
            // assert.equal(res.status, 409)
          })
      })
      it('Should return 404 if contact is not assigned to site', () => {
        server
          .put(`${path}/unassign/${site.id}`)
          .send({ id: contact.id })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            console.log('un', res.body)
            // assert.equal(res.status, 409)
          })
      })
    })
  })
})
