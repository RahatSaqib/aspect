let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Person routes',function(){

  let path = '/api/person'

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a list of persons when using valid token', function(done){
      server
      .get(path)
      .set('x-access-token', shared.token)
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

  describe('POST',function(){
  })

})
