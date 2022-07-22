const chai = require('chai')
const _ = require('lodash')

const shared = require('../utils/sharedToken')

const { assert } = chai

const server = require('../utils/testUtils')

describe('/account-details', () => {
  const pathGlobal = '/api/account-details/current'

  async function getAccountDetails() {
    const response = await server
      .get(pathGlobal)
      .set('Authorization', `Bearer ${shared.token}`)
      .send()
      .then(res => res.body.data)
    return response
  }

  before(() => {
    shared.checkToken(server, pathGlobal)
  })

  describe('/account-details/current-contact', () => {
    describe('PUT', () => {
      const path = `${pathGlobal}-contact`

      let accountDetails
      beforeEach(async () => {
        accountDetails = await getAccountDetails()
      })

      it('should update account details for the currently logged in user and return them', async () => {
        const originalTitle = accountDetails.title
        const newJobTitle = 'New Job Title'
        assert.notEqual(
          accountDetails.title,
          newJobTitle,
          `The title of this person is already set to 'New Job Title'. This could be a problem with the cleanup that was supposed to have happened the last time this test was run. Please update the title of person (id=${accountDetails.id}) to something other than '${newJobTitle}'`
        )
        let contactDetails = _.omit(accountDetails, ['userId', 'username', 'timezone', 'culture'])
        let res = await server
          .put(path)
          .send({ ...contactDetails, title: newJobTitle })
          .set('Authorization', `Bearer ${shared.token}`)

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
        res = await server.get(pathGlobal).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.title, newJobTitle)

        // Clean Up: Update the user with their old title again
        contactDetails = _.omit(accountDetails, ['userId', 'username', 'timezone', 'culture'])

        res = await server
          .put(path)
          .send({ ...contactDetails, title: originalTitle })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.title, originalTitle)
      })
    })
  })

  describe('/account-details/current-preferences', () => {
    describe('PUT', () => {
      const path = `${pathGlobal}-preferences`

      let accountDetails
      beforeEach(async () => {
        accountDetails = await getAccountDetails()
      })

      it('should update user preferences for the currently logged in user and return them', async () => {
        const originalTimezone = accountDetails.timezone
        const newTimezone = 'South Africa Standard Time'
        assert.notEqual(
          accountDetails.timezone,
          newTimezone,
          `The timezone set for this person is already set to 'South Africa Standard Time'. This could be a problem with the cleanup that was supposed to have happened the last time this test was run. Please update the timezone for this person (id=${accountDetails.id}) to something other than '${newTimezone}'`
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
        let res = await server
          .put(path)
          .send({ ...userPreferences, timezone: newTimezone })
          .set('Authorization', `Bearer ${shared.token}`)

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
        res = await server.get(pathGlobal).set('Authorization', `Bearer ${shared.token}`)

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

        res = await server
          .put(path)
          .send({ ...userPreferences, timezone: originalTimezone })
          .set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.body.data.timezone, originalTimezone)
      })
    })
  })
})
