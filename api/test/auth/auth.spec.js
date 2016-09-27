let supertest = require('supertest')
let chai = require('chai')
let jwt = require('jsonwebtoken')
let config = require('../../src/config')
let shared = require('../utils/sharedToken')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Authentication routes',function(){

  let path = '/api/auth'
  let jwToken = ''
  let refreshToken = ''
  let clientId = ''

  describe('POST',function(){

    it('should return 400 and error message if no user name is provided',function(done){
      server
      .post(path)
      .send()
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.isString(res.body.message)
        assert.notEqual('', res.body.message)
        done()
      })
    })

    it('should return 400 and error message if user name is provided, but pw is missing',function(done){
      server
      .post(path)
      .send({ name: 'admin' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'child "password" fails because ["password" is required]')
        done()
      })
    })

    it('should return 400 and error message if user name and password is provided, but client name is missing',function(done){
      server
      .post(path)
      .send({ name: 'admin', password: 'password' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'child "clientName" fails because ["clientName" is required]')
        done()
      })
    })

    it('should return 400 and error message if user not found',function(done){
      server
      .post(path)
      .send({ name: 'MickeyMouse', password: 'password', clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'not found')
        done()
      })
    })

    it('should return 401 and error message if incorrect password',function(done){
      server
      .post(path)
      .send({ name: 'admin', password: 'password', clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 401)
        assert.equal(res.body.message, 'Authentication failed. Wrong password.')
        done()
      })
    })

    it('should return 401 and error message if incorrect password',function(done){
      server
      .post(path)
      .send({ name: 'admin', password: 'password', clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 401)
        assert.equal(res.body.message, 'Authentication failed. Wrong password.')
        done()
      })
    })

    it('should return a JSON message that contains a valid jwt, access token, and client ID if username/password are correct',function(done){
      server
      .post(path)
      .send({ name: 'admin', password: 'test07', clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 100)
        assert.isAbove(res.body.refresh.length, 50)
        assert.isAbove(res.body.clientId.length, 32)

        // save token for the following tests:
        jwToken = res.body.access
        shared.token = jwToken
        refreshToken = res.body.refresh
        clientId = res.body.clientId

        jwt.verify(res.body.access, config.secret, function (err, decoded) {

          assert.isNotOk(err) // isNotOk = is falsy
          assert.property(decoded, 'name')
          assert.property(decoded, 'modules')
          assert.property(decoded, 'permissions')
          assert.property(decoded, 'iat')
          assert.property(decoded, 'exp')
          assert.property(decoded, 'iss')

          done()
        })
      })
    })

  })

  describe('GET',function(){

    shared.checkToken(server, path)

    it('should return 200 and welcome message when using valid token',function(done){
      server
      .get(path)
      .set('Authorization', 'Bearer '+jwToken)
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.equal(res.body.message, 'Welcome to the API!')
        done()
      })
    })

  })

  describe('POST to /refresh',function(){

    it('should return 400 and error message if no client ID provided',function(done){
      server
      .post(path + '/refresh')
      .send()
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.isString(res.body.message)
        assert.notEqual('', res.body.message)
        done()
      })
    })

    it('should return 400 and error message if client ID is provided, but token is missing',function(done){
      server
      .post(path + '/refresh')
      .send({ clientId: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.isString(res.body.message)
        assert.notEqual('', res.body.message)
        done()
      })
    })

    it('should return 400 and error message if invalid token or clientId',function(done){
      server
      .post(path + '/refresh')
      .send({ clientId: 'asdf', token: 'TOKEN' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Unable to find token or token revoked')
        done()
      })
    })

    it('should return a JSON message that contains a valid jwt, access token, and client ID if clientId/refresh token are valid',function(done){
      server
      .post(path + '/refresh')
      .send({ clientId: clientId, token: refreshToken })
      .end(function(err,res){
        assert.equal(res.status, 200)
        assert.isAbove(res.body.access.length, 100)
        assert.isAbove(res.body.refresh.length, 50)
        assert.isAbove(res.body.clientId.length, 32)

        // save token for the following tests:
        jwToken = res.body.access

        jwt.verify(res.body.access, config.secret, function (err, decoded) {

          assert.isNotOk(err) // isNotOk = is falsy
          assert.property(decoded, 'name')
          assert.property(decoded, 'modules')
          assert.property(decoded, 'permissions')
          assert.property(decoded, 'iat')
          assert.property(decoded, 'exp')
          assert.property(decoded, 'iss')

          done()
        })
      })
    })

  })

})
