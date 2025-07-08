const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const Promise = require('bluebird')
const { knex } = require('../../src/db')
const { insertSite } = require('../../src/site/common/db')
const shared = require('../utils/sharedToken')

const { assert } = chai
const { expect } = chai.use(chaiSubset)
const server = require('../utils/testUtils')

describe('Site routes', () => {
  const siteIdToDisable = 3
  describe('/site', () => {
    const path = '/api/site'
    let siteId = 1

    let siteData

    before(() => {
      shared.checkToken(server, path)
    })

    after(async () => {
      // return the test site to its original state
      await knex('Site').where('id', siteIdToDisable).update({ disabled: 0, disabledBy: null, disabledOn: null })
    })

    describe('GET', () => {
      it('should return a list of sites when using valid token', async () => {
        const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 2)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'shortName')
        assert.property(res.body.data[0], 'createdOn')
        assert.property(res.body, 'total')
        siteId = res.body.data[0].id
      })
      it('should return a list of sites for filling a select list', async () => {
        const res = await server.get(`${path}/select-list/all`).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 2)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'stateId')
        assert.property(res.body.data[0], 'stateName')
        assert.property(res.body.data[0], 'partnerId')
        assert.property(res.body.data[0], 'countryId')
        assert.property(res.body.data[0], 'lgaId')
        assert.property(res.body.data[0], 'externalId')
      })
      it('should return a list of sites for filling a select list in Reporter app, with a limited set of fields', async () => {
        const res = await server.get(`${path}/select-list/reporter`).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.equal(res.body.mode, 'reporter')
        assert.isAtLeast(res.body.data.length, 2)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'stateId')
        assert.property(res.body.data[0], 'stateName')
        assert.notProperty(res.body.data[0], 'partnerId')
        assert.notProperty(res.body.data[0], 'countryId')
        assert.notProperty(res.body.data[0], 'lgaId')
        assert.notProperty(res.body.data[0], 'externalId')
      })
      it('should return a single site when using a valid token', async () => {
        const res = await server.get(`${path}/${siteId}`).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'Object')
        assert.property(res.body.data, 'id')
        assert.property(res.body.data, 'name')
        assert.property(res.body.data, 'shortName')
        assert.property(res.body.data, 'state')
        assert.property(res.body.data, 'lga')
        assert.property(res.body.data, 'country')
        assert.property(res.body.data, 'createdOn')
        assert.property(res.body.data, 'totalDevices')
        assert.property(res.body.data, 'countryId')
        assert.property(res.body.data, 'stateId')
        assert.property(res.body.data, 'lgaId')
        assert.property(res.body.data, 'timezone')
        assert.property(res.body.data, 'city')
        assert.property(res.body.data, 'zip')
        assert.property(res.body.data, 'street1')
        assert.property(res.body.data, 'street2')
        assert.property(res.body.data, 'latitude')
        assert.property(res.body.data, 'longitude')
        assert.property(res.body.data, 'geographyId')
        siteData = _.omit(res.body.data, 'geographyId', 'siteTypeExternalId')
      })
    })

    describe('POST', () => {
      let insertedSites = []
      let geo = {}
      let siteTypeLabId
      let newSiteParams
      const dummyName = 'New Site Name'
      const dummyShortName = 'New Site'
      const dummyExternalId = 'New Site ext id'
      before(async () => {
        geo = await knex('Geography').whereNotNull('lgaId').first('id', 'countryId', 'stateId', 'lgaId')
        ;({ siteTypeLabId } = await knex('SiteType').where('externalId', 'lab').first('id as siteTypeLabId'))

        newSiteParams = {
          name: dummyName,
          shortName: dummyShortName,
          externalId: dummyExternalId,
          notes: 'Notes',
          countryId: geo.countryId,
          stateId: geo.stateId,
          lgaId: geo.lgaId,
          city: 'city',
          street1: 'street 1',
          street2: 'street 2',
          zip: 'zip',
          longitude: 59.912731,
          latitude: 60.912731,
          timezone: 'Argentina Standard Time',
          hoursStart: null,
          hoursEnd: null,
          siteTypeId: siteTypeLabId,
          sampleRegistrationAllowed: true,
          parentWarehouseId: null,
        }
      })

      afterEach(async () => {
        if (insertedSites.length > 0) {
          await knex('Site').whereIn('id', insertedSites).del()
          insertedSites = []
        }
      })

      it('Should create a site given new site data', async () => {
        const createSiteResponse = await server
          .post(`${path}`)
          .send(newSiteParams)
          .set('Authorization', `Bearer${shared.token}`)

        const siteId = createSiteResponse?.body
        if (siteId) {
          insertedSites.push(siteId)
        }

        assert.equal(createSiteResponse.status, 200, createSiteResponse.body.message)
        assert.typeOf(createSiteResponse.body, 'Number')

        const insertedSite = await knex('Site').where('id', siteId).first()

        expect(insertedSite).to.containSubset({
          name: dummyName,
          shortName: dummyShortName,
          externalId: dummyExternalId,
          notes: 'Notes',
          geographyId: geo.id,
          city: 'city',
          street1: 'street 1',
          street2: 'street 2',
          zip: 'zip',
          longitude: 59.912731,
          latitude: 60.912731,
          siteTypeId: siteTypeLabId,
          sampleRegistrationAllowed: 1,
          parentWarehouseId: null,
        })
        assert.equal(insertedSite.timezoneid, 'Argentina Standard Time')
      })

      it('Should reject create a duplicate site ', async () => {
        const [exisingSiteId] = await insertSite(knex, {
          name: dummyName,
          shortName: dummyShortName,
          externalId: dummyExternalId,
          siteTypeId: siteTypeLabId,
          sampleRegistrationAllowed: true,
        })

        insertedSites.push(exisingSiteId)

        const createDuplicatedSiteResponse = await server
          .post(`${path}`)
          .send(newSiteParams)
          .set('Authorization', `Bearer${shared.token}`)

        assert.equal(createDuplicatedSiteResponse.status, 409)
      })
    })

    describe('Disable Site', () => {
      it('should disable a site given a siteId', async () => {
        const disableSiteResponse = await server
          .put(`${path}/disable/${siteIdToDisable}`)
          .send()
          .set('Authorization', `Bearer${shared.token}`)

        assert.equal(disableSiteResponse.status, 200)

        // make sure the site has been disabled
        const site = await knex('Site as s')
          .where('s.id', siteIdToDisable)
          .first('s.id', 's.disabled', 's.disabledOn', 's.disabledBy')

        assert.isNotNull(site, 'Site should not be null')
        assert.equal(site.disabled, 1, 'Site should be disabled')
        assert.equal(site.disabledBy, 1, 'Site should be disabled by user')
        assert.isNotNull(site.disabledOn, 'Site should have a disabledOn date')

        // check that constraints filter the disabled site
        const getDisableSiteResponse = await server
          .get(`/api/site/${siteIdToDisable}`)
          .set('Authorization', `Bearer${shared.token}`)

        assert.equal(getDisableSiteResponse.status, 404, 'disabled site should not be retrieved anymore')

        const disableASiteAlreadyDisabledReponse = await server
          .put(`${path}/disable/${siteIdToDisable}`)
          .send()
          .set('Authorization', `Bearer${shared.token}`)

        assert.equal(
          disableASiteAlreadyDisabledReponse.status,
          409,
          'disable an already disabled site should return a 409'
        )
      })

      it('should return 404 when disabling a non existent site', async () => {
        const disableANonExistentSiteReponse = await server
          .put(`${path}/disable/99999`)
          .send()
          .set('Authorization', `Bearer${shared.token}`)

        assert.equal(disableANonExistentSiteReponse.status, 404, 'disable a non existent site should return a 404')
      })
    })

    describe('PUT', () => {
      it('Should update site given a siteId', async () => {
        delete siteData.selectedConsumables
        const originalStreet2 = siteData.street2
        const newStreet2 = '15 New Street'
        const newSiteData = _.omit(siteData, [
          'id',
          'state',
          'lga',
          'country',
          'createdOn',
          'totalDevices',
          'devices',
          'contacts',
          'siteType',
          'parentWarehouseName',
        ])
        const params = { ...newSiteData, street2: newStreet2, tags: 'Tag', sampleRegistrationAllowed: true }
        const updateSiteResponse = await server
          .put(`${path}/${siteId}`)
          .send(params)
          .set('Authorization', `Bearer${shared.token}`)
        assert.equal(updateSiteResponse.status, 200)
        assert.typeOf(updateSiteResponse.body, 'Number')

        // make sure the data has persisted
        const getSiteResponse = await server.get(`/api/site/${siteId}`).set('Authorization', `Bearer${shared.token}`)
        assert.equal(getSiteResponse.body.data.street2, newStreet2)

        // Clean Up: Update street2 with the original street address
        await knex('Site').where('id', siteId).update({ street2: originalStreet2 })
      })
    })

    describe('/select-list', () => {
      let siteTags = []
      const sites = []
      const tags = []
      const clinicTag = { title: '!*Clinic' }
      const labTag = { title: '!*Lab' }
      const lab = {
        name: 'The best lab',
        externalId: 'The best lab',
      }
      const clinic = {
        name: 'The best clinic',
        externalId: 'The best clinic',
      }

      before(async () => {
        const { geographyId } = await knex('Person').orderBy('id').first()
        const { id: partnerId } = await knex('Partner').first()
        clinicTag.partnerId = partnerId
        labTag.partnerId = partnerId
        clinic.partnerId = partnerId
        clinic.geographyId = geographyId
        lab.partnerId = partnerId
        lab.geographyId = geographyId

        // Tags insert
        const [labTagId] = await knex('Tag').insert(labTag)
        labTag.id = labTagId
        tags.push(labTag)
        const [clinicTagId] = await knex('Tag').insert(clinicTag)
        clinicTag.id = clinicTagId
        tags.push(clinicTag)

        // Sites insert
        const [labId] = await insertSite(knex, lab)
        lab.id = labId
        sites.push(lab)
        const [clinicId] = await insertSite(knex, clinic)
        clinic.id = clinicId
        sites.push(clinic)

        siteTags = [
          { siteId: labId, tagId: labTagId },
          { siteId: clinicId, tagId: clinicTagId },
        ]
        await knex('SiteTag').insert(siteTags)
      })

      after(async () => {
        await Promise.each(siteTags, st => knex('SiteTag').where(st).del())

        await Promise.each(tags, tag => knex('Tag').where({ id: tag.id }).del())

        await Promise.each(sites, site => knex('Site').where({ id: site.id }).del())
      })

      describe('GET', () => {
        it('should return a list of sites names and IDs when using valid token filtered by tags', async () => {
          const res = await server
            .get(`${path}/select-list`)
            .query({
              tags: [clinicTag.title, labTag.title],
            })
            .set('Authorization', `Bearer ${shared.token}`)

          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 2)
          assert.equal(res.body.data[1].id, lab.id)
          assert.equal(res.body.data[0].id, clinic.id)
        })
      })
    })
  })
})
