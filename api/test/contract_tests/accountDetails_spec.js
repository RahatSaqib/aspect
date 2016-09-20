let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')
let _ = require('lodash')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('GET /account-details/current',function(){
  const path = '/api/account-details/current'
  shared.checkToken(server, path)

  it('should return the account details for the currently logged in user', function(done){
    server
      .get(path)
      .set('Authorization', 'Bearer ' + shared.token)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'Object')
        const accountDetailsFieldNames = ['id', 'userId', 'username', 'name', 'title', 'email', 'email2',
          'phone', 'cell', 'countryId', 'stateId', 'lgaId', 'timezone', 'culture']
        _.each(accountDetailsFieldNames, function(fieldName) {
          assert.property(res.body.data, fieldName)
        })
        done()
      })
  })
})
