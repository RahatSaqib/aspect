const supertest = require('supertest')
const chai = require('chai')
const shared = require('../utils/sharedToken')
const _ = require('lodash')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('/account-details', () => {
  let accountDetails

  describe('/account-details/current', () => {
    describe('GET', () => {
      const path = '/api/account-details/current'
      shared.checkToken(server, path)

      it('should return the account details for the currently logged in user', done => {
        server
          .get(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            // We need this for the next tests
            accountDetails = res.body.data
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const accountDetailsFieldNames = [
              'id',
              'userId',
              'username',
              'name',
              'title',
              'email',
              'email2',
              'phone',
              'cell',
              'countryId',
              'stateId',
              'lgaId',
              'timezone',
              'culture',
            ]
            _.each(accountDetailsFieldNames, fieldName => {
              assert.property(res.body.data, fieldName)
            })
            done()
          })
      })
    })
  })

  describe('/account-details/current-contact', () => {
    describe('PUT', () => {
      const path = '/api/account-details/current-contact'

      it('should update account details for the currently logged in user and return them', done => {
        const originalTitle = accountDetails.title
        const newJobTitle = 'New Job Title'
        assert.notEqual(
          accountDetails.title,
          newJobTitle,
          `The title of this person is already set to 'New Job Title'. This could be a problem with the cleanup that was supposed to have happened the last time this test was run. Please update the title of person (id=${
            accountDetails.id
          }) to something other than '${newJobTitle}'`
        )
        let contactDetails = _.omit(accountDetails, [
          'userId',
          'username',
          'timezone',
          'culture',
        ])
        server
          .put(path)
          .send(Object.assign({}, contactDetails, { title: newJobTitle }))
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const accountDetailsFieldNames = [
              'id',
              'userId',
              'username',
              'name',
              'title',
              'email',
              'email2',
              'phone',
              'cell',
              'countryId',
              'stateId',
              'lgaId',
              'timezone',
              'culture',
            ]
            _.each(accountDetailsFieldNames, fieldName => {
              assert.property(res.body.data, fieldName)
            })
            assert.equal(res.body.data.title, newJobTitle)

            // Make sure the data has been persisted
            server
              .get('/api/account-details/current')
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, res) => {
                assert.equal(res.body.data.title, newJobTitle)

                // Clean Up: Update the user with their old title again
                contactDetails = _.omit(accountDetails, [
                  'userId',
                  'username',
                  'timezone',
                  'culture',
                ])
                server
                  .put(path)
                  .send(
                    Object.assign({}, contactDetails, { title: originalTitle })
                  )
                  .set('Authorization', `Bearer ${shared.token}`)
                  .end((err, res) => {
                    assert.equal(res.body.data.title, originalTitle)
                    done()
                  })
              })
          })
      })
    })
  })

  describe('/account-details/current-preferences', () => {
    describe('PUT', () => {
      const path = '/api/account-details/current-preferences'

      it('should update user preferences for the currently logged in user and return them', done => {
        const originalTimezone = accountDetails.timezone
        const newTimezone = 'South African Standard Time'
        assert.notEqual(
          accountDetails.timezone,
          newTimezone,
          `The timezone set for this person is already set to 'South African Standard Time'. This could be a problem with the cleanup that was supposed to have happened the last time this test was run. Please update the timezone for this person (id=${
            accountDetails.id
          }) to something other than '${newTimezone}'`
        )
        let userPreferences = _.omit(accountDetails, [
          'userId',
          'username',
          'name',
          'title',
          'email',
          'email2',
          'phone',
          'cell',
          'countryId',
          'stateId',
          'lgaId',
          'zip',
        ])
        server
          .put(path)
          .send(Object.assign({}, userPreferences, { timezone: newTimezone }))
          .set('Authorization', `Bearer ${shared.token}`)
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'Object')
            const accountDetailsFieldNames = [
              'id',
              'userId',
              'username',
              'name',
              'title',
              'email',
              'email2',
              'phone',
              'cell',
              'countryId',
              'stateId',
              'lgaId',
              'timezone',
              'culture',
            ]
            _.each(accountDetailsFieldNames, fieldName => {
              assert.property(res.body.data, fieldName)
            })
            assert.equal(res.body.data.timezone, newTimezone)

            // Make sure the data has been persisted
            server
              .get('/api/account-details/current')
              .set('Authorization', `Bearer ${shared.token}`)
              .end((err, res) => {
                assert.equal(res.body.data.timezone, newTimezone)

                // Clean Up: Update the user with their old title again
                userPreferences = _.omit(accountDetails, [
                  'userId',
                  'username',
                  'name',
                  'title',
                  'email',
                  'email2',
                  'phone',
                  'cell',
                  'countryId',
                  'stateId',
                  'lgaId',
                  'zip',
                ])
                server
                  .put(path)
                  .send(
                    Object.assign({}, userPreferences, {
                      timezone: originalTimezone,
                    })
                  )
                  .set('Authorization', `Bearer ${shared.token}`)
                  .end((err, res) => {
                    assert.equal(res.body.data.timezone, originalTimezone)
                    done()
                  })
              })
          })
      })
    })
  })
})
