let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let camelize = require('camelize')
let endpointUtils = require('../../test/unit_tests/endpointUtils')

describe('person endpoints', function () {
  let person, dbSpy, endpoint

  function setupPersonRoutes(method, path) {
    dbSpy = require('../../test/unit_tests/dbSpy')
    sinon.spy(dbSpy, 'query')
    person = proxyquire.noCallThru().load('./person', {
      '../db': dbSpy
    })
    endpoint = _.find(person, {method: method, path: path})
  }

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('/person/current GET', function () {
    const linkedPersonRecords = [{
        id: 68,
        user_id: 4,
        name: 'Installer Name',
        title: 'Installer',
        email: 'asdf@jalsdfj.com',
        email2: null,
        phone: null,
        cell: null,
        country_id: 1,
        state_id: null,
        lga_id: null,
        person_level_id: 4,
        notes: null,
        last_country_id: 1,
        timezone: 'Eastern Standard Time',
        hide_patient_id: { '0': 0 },
        hide_sample_id: { '0': 0 },
        hide_notes: { '0': 0 },
        culture: 'en-US',
        accepted_license_on: null,
        created_on: '2014-05-26T22:00:00.000Z',
        created_by: '3',
        updated_on: '2016-02-01T18:18:21.000Z',
        updated_by: '1' }
      ],
      requestData = {
        auth: {
          credentials: {
            name: 'logged-in-user'
          }
        }
      }

    beforeEach(function () {
      setupPersonRoutes('GET', '/person/current')
      dbSpy.query.for('Get person records for currently logged in user').resolvesWith(linkedPersonRecords)
    })

    it('Should lookup the person record linked to the user', function (done) {
      endpointUtils.callHandlerOn(endpoint)
        .with(requestData)
        .handleResponseWith(function () {
          const getPersonQuery = dbSpy.query.withArgs('Get person records for currently logged in user').lastCall.returnValue
          assert.equal(getPersonQuery.from.lastCall.args[0], 'user as u')
          assert.deepEqual(getPersonQuery.leftJoin.lastCall.args, ['person as p', 'u.id', 'p.user_id'])
          assert.deepEqual(getPersonQuery.where.lastCall.args[0], {'u.name': requestData.auth.credentials.name})
        })
        .thenCall(done)
        .execute()
    })

    it('Should respond with a list of person objects linked to the currently logged in user', function (done) {
      endpointUtils.callHandlerOn(endpoint)
        .with(requestData)
        .handleResponseWith(function (responseData) {
          assert.deepEqual(responseData.data[0], camelize(linkedPersonRecords[0]))
        })
        .thenCall(done)
        .execute()
    })
  })
})
