let _ = require('lodash')
let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Country routes',function(){

  describe('/api/country/select-list',function(){
    let path = '/api/country/select-list'

    describe('GET',function(){

      shared.checkToken(server, path)

      it('should return a list of country names and IDs in alphabetical order', function(done){
        server
          .get(path)
          .set('Authorization', 'Bearer '+shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1)
            assert.property(res.body.data[0], 'id')
            assert.property(res.body.data[0], 'name')
            let expectedInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
            assert.isTrue(_.isEqual(res.body.data, expectedInAlphabeticalOrder), 'Countries returned are not in alphabetical order ' + JSON.stringify(res.body.data))
            done()
          })
      })
    })
  })
})
