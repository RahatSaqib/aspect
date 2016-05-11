let supertest = require('supertest')
let chai = require('chai')

let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Base route',function(){

  it('should return 200 and "Hello! The API is at /api." in the root',function(done){
    server
    .get('/')
    .end(function(err,res){
      assert.equal(res.status, 200)
      assert.equal(res.text, 'Hello! The API is at /api.')
      done()
    })
  })
})
