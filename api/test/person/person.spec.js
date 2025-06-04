const chai = require('chai')
const chaiSubset = require('chai-subset')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Person routes', () => {
  const path = '/api/person'
  let countryId

  before(async () => {
    shared.checkToken(server, path)
  })

  describe('GET /person', () => {
    const testUserName = 'Joy'
    let testUserId
    let clinicianJobFunctionId
    let technicianJobFunctionId
    const insertedJobContextIds = []

    before(async () => {
      // Insert JobContext records for Test User
      await run(async knex => {
        const testUser = await knex('Person').where({ name: testUserName }).first('id')
        testUserId = testUser.id

        // Get jobFunction ids
        const clinician = await knex('JobFunction').where({ externalId: 'clinician' }).first('id')
        const technician = await knex('JobFunction').where({ externalId: 'technician' }).first('id')

        clinicianJobFunctionId = clinician.id
        technicianJobFunctionId = technician.id

        const jobContexts = [
          { personId: testUserId, jobFunctionId: clinicianJobFunctionId },
          { personId: testUserId, jobFunctionId: clinicianJobFunctionId },
          { personId: testUserId, jobFunctionId: clinicianJobFunctionId },
        ]
        // Insert 3 clinician JobContext records
        const clinicianJobContextPromises = jobContexts.map(async jc => {
          const [id] = await knex('JobContext').insert(jc)

          return typeof id === 'object' ? id.id : id
        })
        const clinicianJobContextIds = await Promise.all(clinicianJobContextPromises)
        insertedJobContextIds.push(...clinicianJobContextIds)
        // Insert 1 technician record in JobContext
        const [techId] = await knex('JobContext').insert({
          personId: testUserId,
          jobFunctionId: technicianJobFunctionId,
        })

        insertedJobContextIds.push(typeof techId === 'object' ? techId.id : techId)
      })
    })

    after(async () => {
      // Remove inserted JobContext records for Test User
      await run(async knex => {
        if (insertedJobContextIds.length) {
          await knex('JobContext').whereIn('id', insertedJobContextIds).del()
        }
      })
    })

    it('should return a list of persons when using valid token', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 3)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'name')
      assert.property(res.body.data[0], 'assignments')
      assert.equal(res.body.data.find(p => p.name === 'Joy').assignments, 'Clinician (3); Technician')
      assert.property(res.body.data[0], 'state')
      assert.property(res.body.data[0], 'lga')
      assert.property(res.body.data[0], 'email')
      assert.property(res.body.data[0], 'cell')
      assert.property(res.body.data[0], 'phone')
      assert.property(res.body.data[0], 'lastLogin')
      assert.property(res.body, 'total')
    })
  })

  describe('PUT', () => {
    let person
    let siteId
    before(() =>
      run(async knex => {
        const dataConstraints = await getConstraints({ name: 'admin' })
        person = await getTestContact(knex, dataConstraints)
        siteId = await getTestSiteId(knex, dataConstraints)
        ;[{ countryId }] = [
          await knex('Site as s')
            .innerJoin('Geography as g', 's.geographyId', 'g.id')
            .where('s.id', siteId)
            .first('g.countryId'),
        ]
      })
    )

    describe('/person/assign/{siteId}', () => {
      it('Should assign contact to site', async () => {
        const resAssign = await server
          .put(`${path}/assign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(resAssign.status, 200)
        assert.typeOf(resAssign.body, 'Object')
        expect(resAssign.body.data).to.containSubset([{ id: person.id }])

        const resAssignDupe = await server
          .put(`${path}/assign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(resAssignDupe.status, 409)
      })

      it('Should return 400 when the ID of the user is not an integer', async () => {
        const res = await server
          .put(`${path}/assign/${siteId}`)
          .send({ id: 'Invalid' })
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 400)
        assert.typeOf(res.body, 'Object')
      })

      it('Should return 404 when trying to assign a user that does not exist', async () => {
        const res = await server
          .put(`${path}/assign/${siteId}`)
          .send({ id: '1000' })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.typeOf(res.body, 'Object')
        expect(res.body).to.include({
          statusCode: 404,
          error: 'Not Found',
          message: 'Not Found',
        })
      })
    })

    describe('/person/unassign/{siteId}', () => {
      it('Should remove contact from site', async () => {
        await server
          .put(`${path}/assign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)

        const res = await server
          .put(`${path}/unassign/${siteId}`)
          .send({ id: person.id })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
      })
    })

    describe('/person/{personId}', () => {
      it('Should update the person record', async () => {
        const personObject = {
          id: person.id,
          name: 'Test Contact',
        }
        let {
          body: { data: updatedPerson },
        } = await server
          .put(`${path}/${person.id}`)
          .send({
            ...personObject,
            hidePatientId: '0',
          })
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isNotOk(updatedPerson.hidePatientId)
        ;({
          body: { data: updatedPerson },
        } = await server
          .put(`${path}/${person.id}`)
          .send({
            ...personObject,
            hidePatientId: 'true',
          })
          .set('Authorization', `Bearer ${shared.token}`))
        assert.isOk(updatedPerson.hidePatientId)
      })
    })
  })

  describe('POST', () => {
    const testingPersonName = 'TESTING PERSON'
    let testingPersonId
    after(() =>
      run(async knex => {
        // remove testing person
        if (testingPersonId) {
          await knex('Person').where({ id: testingPersonId }).del()
        }
      })
    )

    describe('/person', () => {
      it('Should fail to create person because of missing required field `name`', async () => {
        const res = await server.post(`${path}`).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 400)
      })
      it('Should create new person', async () => {
        const res = await server
          .post(`${path}`)
          .send({ name: testingPersonName, countryId })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        const personDetails = res.body.data
        assert.property(personDetails, 'id')
        assert.property(personDetails, 'name')
        assert.property(personDetails, 'username')
        assert.property(personDetails, 'title')
        assert.property(personDetails, 'countryId')
        // keep person id to remove it in after()
        testingPersonId = personDetails.id
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
    .leftJoin('JobContext as jc', 'p.id', 'jc.personId')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
    })
    .first('p.id', 'jc.id as jobContextId')
  return person
}
