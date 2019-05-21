const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe.only('Permissions', () => {
  const path = '/api/job-function'
  const countryAbbreviation = 'US'
  const partner1 = 1
  const personId = 1
  let countryId
  let jobFunctionId
  let cleanJob = false
  let jobId
  let siteId

  before(async () =>
    runTestWithKnex(async knex => {
      ;[{ id: countryId }] = [
        await knex('Country')
          .where('abbreviation', countryAbbreviation)
          .first('id'),
      ]
      ;[{ id: jobFunctionId }] = [
        await knex('JobFunction')
          .where({ partnerId: partner1 })
          .first(),
      ]
      //
      ;[{ id: siteId }] = [
        await knex('Site as s')
          .join('Geography as g', 's.geographyId', 'g.id')
          .where('g.countryId', countryId)
          .where('s.partnerId', partner1)
          .first('s.id'),
      ]
      // if Job doesn't exist then entry added during the test will be removed in after()
      const job = await knex('Job')
        .where({ personId, jobFunctionId })
        .first()
      cleanJob = !job
    })
  )
  after(async () =>
    runTestWithKnex(async knex => {
      if (cleanJob) {
        await knex('Job')
          .where('id', jobId)
          .del()
      }
    })
  )

  describe('Get permissions', () => {
    const path = `/api/job-function/permissions/${personId}/${partner1}`
    shared.checkToken(server, path)
    it('should return 200 and list of permissions for current person and partner', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          // check one permission
          const item = res.body.data.find(x => x === 'person:admin')
          assert.isString(item)
          //
          done()
        })
    })
  })

  describe('Job', () => {
    it('should un-assign person from JobFunction and return list of remaining Jobs for person', done => {
      server
        .post(`${path}/unassign-job`)
        .send({
          personId,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          // list must NOT contain item we just removed
          const jf = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId
          )
          assert.isUndefined(jf)
          //
          done()
        })
    })

    let numJobs = 0
    it('should assign person to JobFunction and return list of Jobs for person', done => {
      server
        .post(`${path}/assign-job`)
        .send({
          personId,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)

          numJobs = res.body.data.length
          let item = res.body.data[0]
          assert.property(item, 'id')
          assert.property(item, 'jobFunctionId')
          assert.property(item, 'personId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId
          )
          assert.typeOf(item, 'Object')
          // get 'jobId' to use in next steps
          jobId = item.id
          assert.isNumber(jobId)
          //
          done()
        })
    })

    it('should return same list of jobs as before after assign person to the same JobFunction', done => {
      server
        .post(`${path}/assign-job`)
        .send({
          personId,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, numJobs)
          let item = res.body.data[0]
          assert.property(item, 'id')
          assert.property(item, 'jobFunctionId')
          assert.property(item, 'personId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId
          )
          assert.typeOf(item, 'Object')
          // get 'jobId' to use in next steps
          jobId = item.id
          assert.isNumber(jobId)
          //
          done()
        })
    })
  })

  describe('Job Context', () => {
    let cleanJobContext = false
    //
    before(async () =>
      runTestWithKnex(async knex => {
        //
        const jobContext = await knex('JobContext')
          .where({ jobId, siteId })
          .whereNull('geographyId')
          .first()
        cleanJobContext = !jobContext
      })
    )
    //
    after(async () =>
      runTestWithKnex(async knex => {
        if (cleanJob || cleanJobContext) {
          await knex('JobContext')
            .where({ jobId, siteId })
            .whereNull('geographyId')
            .del()
        }
        if (cleanJob) {
          await knex('Job')
            .where('id', jobId)
            .del()
        }
      })
    )

    it('should un-assign person from JobContext and return list of remaining JobContexts for person', done => {
      server
        .post(`${path}/unassign-job-context`)
        .send({ jobId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          // list must NOT contain item we just removed
          const item = res.body.data.find(
            x => x.jobId === jobId && x.siteId === siteId && !x.geographyId
          )
          assert.isUndefined(item)
          //
          done()
        })
    })

    it('should assign person to JobContext and return list of JobContexts for person', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          let item = res.body.data[0]
          // assert.property(item, 'id')
          assert.property(item, 'jobId')
          assert.property(item, 'geographyId')
          assert.property(item, 'siteId')
          assert.property(item, 'personId')
          assert.property(item, 'jobFunctionId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.jobId === jobId && x.siteId === siteId && !x.geographyId
          )
          assert.typeOf(item, 'Object')
          //
          done()
        })
    })
  })

  // -----------------------------------------------
  // testing 3 similar tables - JobFunctionDashboardWidget, JobFunctionFeature, JobFunctionPermission
  // -----------------------------------------------
  describe(
    'JobFunction <--> Dashboard Widgets',
    assertBaseItems('JobFunctionDashboardWidget')
  )
  describe('JobFunction <-> Features', assertBaseItems('JobFunctionFeature'))
  describe(
    'JobFunction <-> Permissions',
    assertBaseItems('JobFunctionPermission')
  )
  // helper function for all 3 tables
  function assertBaseItems(tableName) {
    let refTable
    let fieldName
    let itemsPropName
    switch (tableName) {
      case 'JobFunctionDashboardWidget':
        fieldName = 'widgetId' // foreign-key field name in specified tableName
        refTable = 'DashboardWidget' // ref table pointed by FK 'fieldName'
        itemsPropName = 'widgets' // in request payload
        break
      case 'JobFunctionFeature':
        fieldName = 'featureId'
        refTable = 'Feature'
        itemsPropName = 'features'
        break
      case 'JobFunctionPermission':
        fieldName = 'permissionId'
        refTable = 'Permission'
        itemsPropName = 'permissions'
        break
      default:
        return _.noop
    }

    return () => {
      let initialItems = []
      let allRefIds = []
      let items = []
      const totalSampleItems = 5
      //
      before(async () =>
        runTestWithKnex(async knex => {
          allRefIds = await knex(refTable)
            .orderBy('id')
            .select('id')
            .map(x => x.id)
          // checkpoint of all existing items before test to restore them after
          initialItems = await knex(tableName)
            .where({ jobFunctionId })
            .select('jobFunctionId', fieldName)
        })
      )
      //
      after(async () =>
        runTestWithKnex(async knex => {
          // restore to checkpoint
          await knex(tableName)
            .where({ jobFunctionId })
            .del()
          await knex(tableName).insert(initialItems)
        })
      )

      it(`should un-assign ${totalSampleItems} ${itemsPropName} from JobFunction and return list of remaining ${itemsPropName} for this jobFunction`, done => {
        items = _.sampleSize(allRefIds, totalSampleItems)
        server
          .post(`${path}/unassign-${itemsPropName}`)
          .send({ jobFunctionId, [itemsPropName]: items })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'ok')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            // list must NOT contain items we just removed
            const item = res.body.data.find(
              x =>
                x.jobFunctionId === jobFunctionId &&
                items.includes(x[fieldName])
            )
            assert.isUndefined(item)
            //
            done()
          })
      })

      it(`should assign ${totalSampleItems} ${itemsPropName} to JobFunction and return list of all ${itemsPropName} for this jobFunction`, done => {
        server
          .post(`${path}/assign-${itemsPropName}`)
          .send({ jobFunctionId, [itemsPropName]: items })
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'ok')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, totalSampleItems)
            let item = res.body.data[0]
            assert.property(item, fieldName)
            assert.property(item, 'jobFunctionId')
            // list must contain items we just added
            item = res.body.data.find(
              x =>
                x.jobFunctionId === jobFunctionId &&
                items.includes(x[fieldName])
            )
            assert.typeOf(item, 'Object')
            //
            done()
          })
      })
    }
  }
})
