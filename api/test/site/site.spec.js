const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const _ = require('lodash')

// This agent refers to PORT where program is running.
const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Site routes', () => {
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
            assert.isAtLeast(res.body.data.length, 3)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'name')
            assert.property(res.body.data[0], 'shortname')
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
            assert.property(res.body.data, 'shortname')
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
        ])
        server
          .put(`${path}/${siteId}`)
          .send(Object.assign({}, newSiteData, { street2: newStreet2 }))
          .set('Authorization', `Bearer${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const siteFieldNames = [
              'id',
              'name',
              'shortname',
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
                  .send(
                    Object.assign({}, newSiteData, { street2: originalStreet2 })
                  )
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
              assert.isAtLeast(res.body.data.length, 3)
              assert.property(res.body.data[0], 'id')
              assert.property(res.body.data[0], 'name')
              done()
            })
        })
      })
    })
  })
})
