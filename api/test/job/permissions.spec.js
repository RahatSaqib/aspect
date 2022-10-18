const Promise = require('bluebird')

const chai = require('chai')
const _ = require('lodash')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Permissions', () => {
  const path = '/api/job-function'
  const countryAbbreviation = 'US'
  const partner1 = 1
  const personId = 1
  const wrongValue = 99999999
  let countryId
  let jobFunctionId
  let cleanJob = false
  let jobId
  let siteId
  let siteName
  let geographyId

  before(() =>
    runTestWithKnex(async knex => {
      ;[{ id: countryId }] = [await knex('Country').where('abbreviation', countryAbbreviation).first('id')]
      ;[{ id: jobFunctionId }] = [await knex('JobFunction').where({ partnerId: partner1 }).first()]
      ;[{ id: siteId, name: siteName, geographyId }] = [
        await knex('Site as s')
          .join('Geography as g', 's.geographyId', 'g.id')
          .where('g.countryId', countryId)
          .where('s.partnerId', partner1)
          .first('s.id', 's.name', 's.geographyId'),
      ]
      // if Job doesn't exist then entry added during the test will be removed in after()
      const job = await knex('Job').where({ personId, jobFunctionId }).first()
      cleanJob = !job
    })
  )
  after(() =>
    runTestWithKnex(async knex => {
      if (cleanJob) {
        await knex('Job').where('id', jobId).del()
      }
    })
  )

  describe('Get permissions', () => {
    const path = `/api/job-function/permissions/${personId}/${partner1}`
    before(() => {
      shared.checkToken(server, path)
    })
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
          const item = res.body.data.find(x => x === 'person:edit')
          assert.isString(item)
          //
          done()
        })
    })
  })

  describe('Job', () => {
    /*
    deleting Job also deletes linked JobContext entries,
    and we need to restore original values in after()
    */
    let jobContextsOld
    before(() =>
      runTestWithKnex(async knex => {
        // keep JobContext entries, if any exists
        jobContextsOld = await knex('JobContext as jc')
          .join('Job as j', 'jc.jobId', 'j.id')
          .where('j.personId', personId)
          .where('j.jobFunctionId', jobFunctionId)
          .select('jc.geographyId', 'jc.siteId')
      })
    )
    //
    after(() =>
      runTestWithKnex(async knex => {
        await Promise.each(jobContextsOld, async jc => {
          const jcOld = await knex('JobContext')
            .where({ jobId })
            .where(function () {
              if (jc.geographyId) {
                this.where({ geographyId: jc.geographyId })
              } else if (jc.siteId) {
                this.where({ siteId: jc.siteId })
              }
            })
            .first()
          if (!jcOld) {
            await knex('JobContext').insert({
              jobId,
              geographyId: jc.geographyId,
              siteId: jc.siteId,
            })
          }
        })
      })
    )
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
          const jf = res.body.data.find(x => x.personId === personId && x.jobFunctionId === jobFunctionId)
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
          item = res.body.data.find(x => x.personId === personId && x.jobFunctionId === jobFunctionId)
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
          item = res.body.data.find(x => x.personId === personId && x.jobFunctionId === jobFunctionId)
          assert.typeOf(item, 'Object')
          // get 'jobId' to use in next steps
          jobId = item.id
          assert.isNumber(jobId)
          //
          done()
        })
    })
    it('should fail - wrong personId', done => {
      server
        .post(`${path}/assign-job`)
        .send({
          personId: wrongValue,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          assert.equal(res.body.message, `Can not find person with id=${wrongValue}`)
          //
          done()
        })
    })
    it('should fail - personId is from another geography (i.e. another country)', done => {
      server
        .post(`${path}/assign-job`)
        .send({
          personId: 7,
          jobFunctionId,
        })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          //
          done()
        })
    })
  })

  describe('Job Context', () => {
    let cleanJobContext = false
    //
    before(() =>
      runTestWithKnex(async knex => {
        //
        const jobContext = await knex('JobContext').where({ jobId, siteId }).whereNull('geographyId').first()
        cleanJobContext = !jobContext
      })
    )
    //
    after(() =>
      runTestWithKnex(async knex => {
        if (cleanJob || cleanJobContext) {
          await knex('JobContext').where({ jobId, siteId }).whereNull('geographyId').del()
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
          const item = res.body.data.find(x => x.jobId === jobId && x.siteId === siteId && !x.geographyId)
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
          item = res.body.data.find(x => x.jobId === jobId && x.siteId === siteId && !x.geographyId)
          assert.typeOf(item, 'Object')
          //
          done()
        })
    })

    it('should fail - either `siteId` or `geographyId` is needed, not both', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId, siteId, geographyId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 409) // Boom.conflict
          assert.equal(res.body.message, 'Either geographyId or siteId (not both) is needed to manage JobContext')
          //
          done()
        })
    })
    it('should fail - missing both `siteId` and `geographyId`', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 409) // Boom.conflict
          assert.equal(res.body.message, 'Either geographyId or siteId (not both) is needed to manage JobContext')
          //
          done()
        })
    })
    it('should fail - missing jobId or both (personId and jobFunctionId)', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ siteId, geographyId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 417) // Boom.expectationFailed
          assert.equal(res.body.message, 'Either jobId or (personId and jobFunctionId) is needed to manage JobContext')
          //
          done()
        })
    })
    it('should fail - wrong jobId', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId: wrongValue, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          assert.equal(res.body.message, `Missing job with specified jobId=${wrongValue}`)
          //
          done()
        })
    })
    it('should fail - wrong siteId', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId, siteId: wrongValue })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          assert.equal(res.body.message, `Missing site with specified siteId=${wrongValue}`)
          //
          done()
        })
    })
    it('should fail - wrong geographyId', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId, geographyId: wrongValue })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          assert.equal(res.body.message, `Missing geography with specified geographyId=${wrongValue}`)
          //
          done()
        })
    })
    it('should fail - current Admin user and jobId point to different partnerId', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ jobId: 8, geographyId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 417) // Boom.expectationFailed
          assert.equal(res.body.message, 'Only Admin with same partnerId as Job/JobFunction can manage Jobs')
          //
          done()
        })
    })
  })

  // -----------------------------------------------
  // testing 3 similar tables - JobFunctionDashboardWidget, JobFunctionPermission
  // -----------------------------------------------
  describe('JobFunction <--> Dashboard Widgets', assertBaseItems('JobFunctionDashboardWidget'))
  describe('JobFunction <-> Permissions', assertBaseItems('JobFunctionPermission'))
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
      before(() =>
        runTestWithKnex(async knex => {
          allRefIds = await knex(refTable).orderBy('id').pluck('id')
          // checkpoint of all existing items before test to restore them after
          initialItems = await knex(tableName).where({ jobFunctionId }).select('jobFunctionId', fieldName)
        })
      )
      //
      after(() =>
        runTestWithKnex(async knex => {
          // restore to checkpoint
          await knex(tableName).where({ jobFunctionId }).del()
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
            const item = res.body.data.find(x => x.jobFunctionId === jobFunctionId && items.includes(x[fieldName]))
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
            item = res.body.data.find(x => x.jobFunctionId === jobFunctionId && items.includes(x[fieldName]))
            assert.typeOf(item, 'Object')
            //
            done()
          })
      })
    }
  }

  describe('Person Assignments', () => {
    let jobFunctionClinicianId
    let jobContextId
    const toCleanUp = {
      jobProps: null,
      jobContextProps: null,
      jobContextIds: [],
    }

    before(() =>
      runTestWithKnex(async knex => {
        ;[{ id: jobFunctionClinicianId }] = [
          await knex('JobFunction').where({ partnerId: partner1, name: 'Clinician' }).first('id'),
        ]

        const jobProps = { personId, jobFunctionId: jobFunctionClinicianId }
        const job = await knex('Job').where(jobProps).first()
        if (!job) {
          // if such Job is missing - keep it's properties to remove it in after()
          toCleanUp.jobProps = jobProps
          // --> toCleanUp.jobContextIds will be defined when assigning person to job
        } else {
          const jobContextProps = { jobId: job.id, siteId }
          // check if JobContext exists
          const jobContext = await knex('JobContext').where(jobContextProps).first()
          if (!jobContext) {
            // if such JobContext is missing - keep it's properties to remove it in after()
            toCleanUp.jobContextProps = jobContextProps
          }
        }
      })
    )

    after(() =>
      runTestWithKnex(async knex => {
        // if Job existed but JobContext didn't exist before this test
        if (toCleanUp.jobContextProps) {
          await knex('JobContext').where(toCleanUp.jobContextProps).del()
        }
        // if Job didn't exist before this test, we got jobContextId after assigning person
        if (toCleanUp.jobContextIds.length) {
          await knex('JobContext').whereIn('id', toCleanUp.jobContextIds).del()
        }
        if (toCleanUp.jobProps) {
          await knex('Job').where(toCleanUp.jobProps).del()
        }
      })
    )

    function assertItemProperties(item) {
      assert.property(item, 'personId')
      assert.property(item, 'partnerId')
      assert.property(item, 'jobId')
      assert.property(item, 'jobFunctionId')
      assert.property(item, 'jobFunctionName')
      assert.property(item, 'jobContextId')
      assert.property(item, 'countryId')
      assert.property(item, 'countryName')
      assert.property(item, 'stateId')
      assert.property(item, 'stateName')
      assert.property(item, 'lgaId')
      assert.property(item, 'lgaName')
      assert.property(item, 'siteId')
      assert.property(item, 'siteName')
    }

    it('should return list of person assignments', done => {
      server
        .get(`${path}/person-assignments/${personId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          const items = res.body.data
          assert.typeOf(items, 'array')
          if (items.length) {
            const item = items[0]
            assertItemProperties(item)
          }
          done()
        })
    })

    it('should assign person to site as Clinician', done => {
      server
        .post(`${path}/assign-person-to-job-and-context`)
        .send({ personId, jobFunctionId: jobFunctionClinicianId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          const items = res.body.data
          assert.typeOf(items, 'array')
          assert.isAtLeast(items.length, 1)

          const item = items.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionClinicianId && x.siteId === siteId
          )
          assertItemProperties(item)
          assert.equal(item.siteName, siteName)

          // keep jobContextId if Job didn't exist before this test, in which case jobContextId
          // is needed to delete JobContext in after()
          if (toCleanUp.jobProps) {
            toCleanUp.jobContextIds.push(item.jobContextId)
          }

          // keep jobContextId to delete it in next text
          ;[{ jobContextId }] = [item]

          done()
        })
    })
    it('should remove person assignment to site as Clinician', done => {
      server
        .delete(`${path}/person-assignment/${personId}/${jobContextId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          const items = res.body.data
          assert.typeOf(items, 'array')

          const item = items.find(x => x.personId === personId && x.jobContextId === jobContextId)
          assert.isUndefined(item)

          done()
        })
    })
  })
})
