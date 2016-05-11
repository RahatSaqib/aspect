let supertest = require('supertest')
let chai = require('chai')
let jwt = require('jsonwebtoken')
let config = require('./../config')

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
        assert.equal(res.body.message, 'No user name provided')
        done()
      })
    })

    it('should return 400 and error message if user name is provided, but pw is missing',function(done){
      server
      .post(path)
      .send({ name: 'admin' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'No password provided')
        done()
      })
    })

    it('should return 400 and error message if user name and password is provided, but client name is missing',function(done){
      server
      .post(path)
      .send({ name: 'admin', password: 'password' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'No client name provided')
        done()
      })
    })

    it('should return 400 and error message if user not found',function(done){
      server
      .post(path)
      .send({ name: 'MickeyMouse', password: 'password', clientName: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'user not found')
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
        refreshToken = res.body.refresh
        clientId = res.body.clientId

        jwt.verify(res.body.access, config.secret, function (err, decoded) {

          assert.isNotOk(err) // isNotOk = is falsy
          assert.property(decoded, 'name')
          assert.property(decoded, 'modules')
          assert.property(decoded, 'roles')
          assert.property(decoded, 'iat')
          assert.property(decoded, 'exp')
          assert.property(decoded, 'iss')

          done()
        })
      })
    })

  })

  describe('GET',function(){

    it('should return 403 and error message when trying to get without access token',function(done){
      server
      .get(path)
      .end(function(err,res){
        assert.equal(res.status, 403)
        assert.equal(res.body.message, 'No token provided')
        done()
      })
    })

    it('should return 401 and error message when using invalid token',function(done){
      server
      .get(path)
      .set('x-access-token', 'MOARTOKENZ')
      .end(function(err,res){
        assert.equal(res.status, 401)
        assert.equal(res.body.message, 'Failed to authenticate token')
        done()
      })
    })

    it('should return 401 and error message when using outdated token',function(done){
      server
      .get(path)
      .set('x-access-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic2JhdW1nYXJ0bmVyIiwibW9kdWxlcyI6WyJpbnYiLCJtYWkiXSwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNDYyOTgyNTAyLCJleHAiOjE0NjI5ODYxMDIsImlzcyI6Imh0dHBzOi8vd3d3LmFzcGVjdC5pZCJ9.MhKor2PE9FLeEHdCh3GgsddOt_toq_ZcDdaRXMURTkc')
      .end(function(err,res){
        assert.equal(res.status, 401)
        assert.equal(res.body.message, 'Failed to authenticate token')
        done()
      })
    })

    it('should return 200 and welcome message when using valid token',function(done){
      server
      .get(path)
      .set('x-access-token', jwToken)
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
        assert.equal(res.body.message, 'No client ID provided')
        done()
      })
    })

    it('should return 400 and error message if client ID is provided, but token is missing',function(done){
      server
      .post(path + '/refresh')
      .send({ clientId: 'Mocha/Chai' })
      .end(function(err,res){
        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'No token provided')
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
          assert.property(decoded, 'roles')
          assert.property(decoded, 'iat')
          assert.property(decoded, 'exp')
          assert.property(decoded, 'iss')

          done()
        })
      })
    })

  })

})
