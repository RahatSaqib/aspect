let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Site routes',function(){

  let path = '/api/site'

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a list of sites when using valid token', function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer ' + shared.token)
      .end(function(err,res){
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
        done()
      })
    })

  })

  describe('POST',function(){
  })

})
