let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')
let _ = require('lodash')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Person routes',function(){
  describe('GET /person',function(){
    const path = '/api/person'
    shared.checkToken(server, path)

    it('should return a list of persons when using valid token', function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer '+shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAtLeast(res.body.data.length, 3)
        assert.property(res.body.data[0], 'id')
        assert.property(res.body.data[0], 'name')
        assert.property(res.body.data[0], 'level')
        assert.property(res.body.data[0], 'state')
        assert.property(res.body.data[0], 'lga')
        assert.property(res.body, 'total')
        done()
      })
    })
  })

  describe('GET /person/current',function(){
    const path = '/api/person/current'
    shared.checkToken(server, path)

    it('should return the person object linked to the currently logged in user\'s profile', function(done){
      server
        .get(path)
        .set('Authorization', 'Bearer ' + shared.token)
        .end(function(err,res){
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.equal(res.body.data.length, 1)
          const personFieldNames = ['id', 'userId', 'name', 'title', 'email', 'email2',
            'phone', 'cell', 'countryId', 'stateId', 'lgaId', 'personLevelId',
            'notes', 'lastCountryId', 'timezone', 'hidePatientId', 'hideSampleId',
            'hideNotes', 'culture', 'acceptedLicenseOn', 'createdOn', 'createdBy',
            'updatedOn', 'updatedBy']
          _.each(personFieldNames, function(fieldName) {
            assert.property(res.body.data[0], fieldName)
          })
          done()
        })
    })
  })

})
