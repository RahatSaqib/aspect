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

  describe('Job Context', () => {
    let cleanJobContext = false
    //
    before(() =>
      runTestWithKnex(async knex => {
        //
        const jobContext = await knex('JobContext')
          .where({ personId, jobFunctionId, siteId })
          .whereNull('geographyId')
          .first()
        cleanJobContext = !jobContext
      })
    )
    //
    after(() =>
      runTestWithKnex(async knex => {
        if (cleanJobContext) {
          await knex('JobContext').where({ personId, jobFunctionId, siteId }).whereNull('geographyId').del()
        }
      })
    )

    it('should un-assign person from JobContext and return list of remaining JobContexts for person', done => {
      server
        .post(`${path}/unassign-job-context`)
        .send({ personId, jobFunctionId, siteId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'ok')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          // list must NOT contain item we just removed
          const item = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId && x.siteId === siteId && !x.geographyId
          )
          assert.isUndefined(item)
          //
          done()
        })
    })

    it('should assign person to JobContext and return list of JobContexts for person', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ personId, jobFunctionId, siteId })
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
          assert.property(item, 'geographyId')
          assert.property(item, 'siteId')
          assert.property(item, 'jobFunctionId')
          // list must contain item we just added
          item = res.body.data.find(
            x => x.personId === personId && x.jobFunctionId === jobFunctionId && x.siteId === siteId && !x.geographyId
          )
          assert.typeOf(item, 'Object')
          //
          done()
        })
    })

    it('should fail - either `siteId` or `geographyId` is needed, not both', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ personId, jobFunctionId, siteId, geographyId })
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
        .send({ personId, jobFunctionId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 409) // Boom.conflict
          assert.equal(res.body.message, 'Either geographyId or siteId (not both) is needed to manage JobContext')
          //
          done()
        })
    })
    it('should fail - missing (personId and jobFunctionId)', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ siteId, geographyId })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 417) // Boom.expectationFailed
          assert.equal(res.body.message, 'personId and jobFunctionId is needed to manage JobContext')
          //
          done()
        })
    })
    it('should fail - wrong siteId', done => {
      server
        .post(`${path}/assign-job-context`)
        .send({ personId, jobFunctionId, siteId: wrongValue })
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
        .send({ personId, jobFunctionId, geographyId: wrongValue })
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 422) // Boom.badData
          assert.equal(res.body.message, `Missing geography with specified geographyId=${wrongValue}`)
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

        const jobContextProps = { personId, jobFunctionId: jobFunctionClinicianId, siteId }
        // check if JobContext exists
        const jobContext = await knex('JobContext').where(jobContextProps).first()
        if (!jobContext) {
          // if such JobContext is missing - keep it's properties to remove it in after()
          toCleanUp.jobContextProps = jobContextProps
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
      })
    )

    function assertItemProperties(item) {
      assert.property(item, 'personId')
      assert.property(item, 'partnerId')
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
      // Optional properties
      if (item.tagId !== null && item.tagId !== undefined) {
        assert.property(item, 'tagId')
        assert.property(item, 'tagTitle')
      }
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

    it('should block unauthorised users from assigning jobs that are outside of their geographic scope', async () => {
      const originalPermissions = await server
        .get(`/api/job-function/permissions/${personId}/${partner1}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => res.body)

      const clinicianAuthResponse = await server
        .post('/api/auth')
        .send({
          name: 'clinician',
          password: 'test07',
          clientName: 'Mocha web',
          clientType: 'web',
        })
        .then(res => res.body)

      const assignPermissionResponse = await server
        .post(`${path}/assign-person-to-job-and-context`)
        .send({ personId, jobFunctionId: jobFunctionClinicianId, countryId })
        .set('Authorization', `Bearer ${clinicianAuthResponse.access}`)

      assert.equal(403, assignPermissionResponse.status)

      const newPermissions = await server
        .get(`/api/job-function/permissions/${personId}/${partner1}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => res.body)
      assert.deepEqual(originalPermissions, newPermissions)
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

    describe('with tag filtering', () => {
      let tagId
      let jobContextIdToClean

      before(() =>
        runTestWithKnex(async knex => {
          // Create a tag
          const tag = { title: 'TestSiteTag', partnerId: partner1 }
          ;[tagId] = await knex('Tag').insert(tag)

          // Assign tag to site (create SiteTag entry)
          await knex('SiteTag').insert({ siteId, tagId })
        })
      )

      after(() =>
        runTestWithKnex(async knex => {
          // Clean up in correct order to avoid foreign key constraints
          if (jobContextIdToClean) {
            await knex('JobContext').where({ id: jobContextIdToClean }).del()
          }
          if (siteId && tagId) {
            await knex('SiteTag').where({ siteId, tagId }).del()
          }
          if (tagId) {
            await knex('Tag').where({ id: tagId }).del()
          }
        })
      )

      it('should assign person to site as Clinician with tag filtering', done => {
        server
          .post(`${path}/assign-person-to-job-and-context`)
          .send({ personId, jobFunctionId: jobFunctionClinicianId, siteId, tagId })
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
              x =>
                x.personId === personId &&
                x.jobFunctionId === jobFunctionClinicianId &&
                x.siteId === siteId &&
                x.tagId === tagId
            )
            assertItemProperties(item)
            assert.equal(item.siteName, siteName)
            assert.equal(item.tagId, tagId)
            assert.equal(item.tagTitle, 'TestSiteTag')

            jobContextIdToClean = item.jobContextId

            done()
          })
      })

      it('should return only sites with tags when filtering by tag in site list', done => {
        let untaggedSiteId
        runTestWithKnex(async knex => {
          // Get another site without the tag to verify it's filtered out
          const untaggedSite = await knex('Site as s')
            .join('Geography as g', 's.geographyId', 'g.id')
            .where('g.countryId', countryId)
            .where('s.partnerId', partner1)
            .where('s.id', '!=', siteId)
            .whereNotExists(knex('SiteTag as st').whereColumn('st.siteId', 's.id').where('st.tagId', tagId))
            .first('s.id')

          if (untaggedSite) {
            untaggedSiteId = untaggedSite.id
          }
        })
          .then(() => {
            // Get all sites without tag filter
            server
              .get('/api/site/select-list')
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, resWithoutFilter) => {
                assert.equal(resWithoutFilter.status, 200)
                const allSites = resWithoutFilter.body.data
                assert.typeOf(allSites, 'array')
                const taggedSiteInAll = allSites.find(s => s.id === siteId)
                assert.isDefined(taggedSiteInAll, 'Tagged site should be in unfiltered list')

                // Get sites with tag filter
                // Hapi array query params must be passed as repeated parameters: tags=value1&tags=value2
                // For a single value in an array, we pass it twice to generate the format Hapi expects
                const tagTitle = 'TestSiteTag'
                // Pass as repeated parameter so Hapi parses it as an array
                server
                  .get(
                    `/api/site/select-list?tags=${encodeURIComponent(tagTitle)}&tags=${encodeURIComponent(tagTitle)}`
                  )
                  .set('Authorization', `Bearer ${shared.token}`)
                  .end((err, resWithFilter) => {
                    assert.equal(resWithFilter.status, 200)
                    assert.typeOf(resWithFilter.body, 'Object')
                    assert.property(resWithFilter.body, 'ok')
                    assert.property(resWithFilter.body, 'data')
                    const filteredSites = resWithFilter.body.data
                    assert.typeOf(filteredSites, 'array')

                    // Verify tagged site is included
                    const taggedSite = filteredSites.find(s => s.id === siteId)
                    assert.isDefined(taggedSite, 'Tagged site should be in filtered list')
                    assert.equal(taggedSite.id, siteId)

                    // Verify untagged site is excluded (if it exists)
                    if (untaggedSiteId) {
                      const untaggedSite = filteredSites.find(s => s.id === untaggedSiteId)
                      assert.isUndefined(untaggedSite, 'Untagged site should be excluded from filtered list')
                    }

                    // Verify filtered list has fewer or equal sites than unfiltered
                    assert.isAtMost(
                      filteredSites.length,
                      allSites.length,
                      'Filtered list should have fewer or equal sites than unfiltered list'
                    )

                    done()
                  })
              })
          })
          .catch(done)
      })
    })
  })
})
