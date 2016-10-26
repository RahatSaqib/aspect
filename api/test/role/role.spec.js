let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Role routes',function(){

  let path = '/api/role/select-list'

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return a tree structure of partners, organisational units and roles', function(done){
      server
        .get(path)
        .set('Authorization', 'Bearer '+ shared.token)
        .end(function(err,res){
          console.log(res)
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 2)
          assert.isNull(res.body.data[0].id)
          assert.isNull(res.body.data[0].name)
          assert.typeOf(res.body.data[0].roles, 'array')

          assert.property(res.body.data[1], 'id')
          assert.property(res.body.data[1], 'name')
          assert.typeOf(res.body.data[1].roles, 'array')
          assert.typeOf(res.body.data[1].orgUnits, 'array')

          assert.isAtLeast(res.body.data[1].orgUnits.length, 1)
          assert.property(res.body.data[1].orgUnits[0], 'id')
          assert.property(res.body.data[1].orgUnits[0], 'name')
          assert.typeOf(res.body.data[1].orgUnits[0].roles, 'array')
          done()
        })
    })
  })
})
