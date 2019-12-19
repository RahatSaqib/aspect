const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const { knex } = require('../../src/db')
const Promise = require('bluebird')

const shared = require('../utils/sharedToken')

const { assert } = chai
const server = supertest.agent('http://localhost:8080')

describe.only('Site routes', () => {
  describe('/site', () => {
    const path = '/api/site'
    let siteId = 1
    let siteData
    describe('GET', () => {
      shared.checkToken(server, path)

      it('should return a list of sites when using valid token', done => {
        server
          .get(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
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
            done()
          })
      })
      it('should return a single site when using a valid token', done => {
        server
          .get(`${path}/${siteId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
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
            assert.property(res.body.data, 'longitude')
            siteData = res.body.data
            done()
          })
      })
    })

    describe('POST', () => {})

    describe('PUT', () => {
      it('Should update site given a siteId', done => {
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
        ])
        server
          .put(`${path}/${siteId}`)
          .send({ ...newSiteData, street2: newStreet2 })
          .set('Authorization', `Bearer${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const siteFieldNames = [
              'id',
              'name',
              'shortName',
              'state',
              'lga',
              'country',
              'createdOn',
              'totalDevices',
              'countryId',
              'stateId',
              'lgaId',
              'timezone',
              'city',
              'zip',
              'street1',
              'street2',
              'longitude',
            ]
            _.each(siteFieldNames, fieldName => {
              assert.property(res.body.data, fieldName)
            })
            // check the updated property
            assert.equal(res.body.data.street2, newStreet2)

            // make sure the data has persisted
            server
              .get(`/api/site/${siteId}`)
              .set('Authorization', `Bearer${shared.token}`)
              .end((err, res) => {
                assert.equal(res.body.data.street2, newStreet2)

                // Clean Up: Update street2 with the original street address
                server
                  .put(`${path}/${siteId}`)
                  .send({ ...newSiteData, street2: originalStreet2 })
                  .set('Authorization', `Bearer${shared.token}`)
                  .end((err, res) => {
                    assert.equal(res.body.data.street2, originalStreet2)
                    done()
                  })
              })
          })
      })
    })

    describe('/select-list', () => {
      let siteTags = null
      const sites = []
      const tags = []
      let partnerId = null
      const clinicTag = { title: '!*Clinic', partnerId: null }
      const labTag = { title: '!*Lab', partnerId: null }
      const lab = {
        name: 'The best lab',
        externalId: 'The best lab',
        partnerId: null,
        geographyId: 38,
      }
      const clinic = {
        name: 'The best clinic',
        externalId: 'The best clinic',
        partnerId: null,
        geographyId: 38,
      }

      before(async () => {
        partnerId = await knex('Partner').first().id
        clinicTag.partnerId = partnerId
        labTag.partnerId = partnerId
        clinic.partnerId = partnerId
        lab.partnerId = partnerId

        // Tags insert
        const labTagId = await knex('Tag').insert(labTag)
        labTag.id = labTagId
        const clinicTagId = await knex('Tag').insert(clinicTag)
        clinicTag.id = clinicTagId

        // Sites insert
        const labId = await knex('Site').insert(lab)
        lab.id = labId
        sites.push(lab)
        const clinicId = await knex('Site').insert(clinic)
        clinic.id = clinicId
        sites.push(clinic)

        siteTags = [
          { siteId: labId, tagId: labTagId },
          { siteId: clinicId, tagId: clinicTagId },
        ]
        await knex('SiteTag').insert(siteTags)
      })

      after(async () => {
        await Promise.each(siteTags, st =>
          knex('SiteTag')
            .where(st)
            .del()
        )

        await Promise.each(tags, tag =>
          knex('Tag')
            .where(tag)
            .del()
        )

        await Promise.each(sites, site =>
          knex('Site')
            .where({ id: site.id })
            .del()
        )
      })

      describe('GET', () => {
        it('should return a list of sites names and IDs when using valid token', done => {
          server
            .get(`${path}/select-list`)
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.isAtLeast(res.body.data.length, 2)
              assert.property(res.body.data[0], 'id')
              assert.property(res.body.data[0], 'name')
              assert.property(res.body.data[0], 'shortName')
              assert.property(res.body.data[0], 'partnerId')
              assert.property(res.body.data[0], 'countryId')
              assert.property(res.body.data[0], 'stateId')
              assert.property(res.body.data[0], 'lgaId')
              assert.property(res.body.data[0], 'lgaName')
              assert.property(res.body.data[0], 'stateName')
              assert.property(res.body.data[0], 'longitude')
              assert.property(res.body.data[0], 'latitude')
              assert.property(res.body.data[0], 'zip')
              assert.property(res.body.data[0], 'street1')
              assert.property(res.body.data[0], 'street2')
              assert.property(res.body.data[0], 'city')
              assert.property(res.body.data[0], 'externalId')
              done()
            })
        })

        it('should return a list of sites names and IDs when using valid token filtered by tags', done => {
          server
            .get(
              `${path}/select-list?tags=${encodeURIComponent(
                JSON.stringify([clinicTag.title, labTag.title])
              )}`
            )
            .set('Authorization', `Bearer ${shared.token}`)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assert.typeOf(res.body, 'Object')
              assert.property(res.body, 'data')
              assert.typeOf(res.body.data, 'array')
              assert.equal(res.body.data.length, 2)
              assert.equal(res.body.data[1].id, lab.id)
              assert.equal(res.body.data[0].id, clinic.id)
              done()
            })
        })
      })
    })
  })
})
