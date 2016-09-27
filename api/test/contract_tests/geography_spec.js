let _ = require('lodash')
let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Geography routes',function(){

  describe('/api/geography/select-list',function(){
    let path = '/api/geography/select-list'

    describe('GET',function(){

      shared.checkToken(server, path)

      it('should return a list of countries, each with its nested set of states and LGAs, all ordered by name', function(done){
        server
          .get(path)
          .set('Authorization', 'Bearer '+shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1)
            let expectedCountriesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
            assert.isTrue(_.isEqual(res.body.data, expectedCountriesInAlphabeticalOrder), 'Countries returned are not in alphabetical order ' + JSON.stringify(res.body.data))
            _.each(res.body.data, function(country) {
              assert.property(country, 'id')
              assert.property(country, 'name')
              assert.property(country, 'states')
              let expectedStatesInAlphabeticalOrder = _.orderBy(country.states, 'name', 'asc')
              assert.isTrue(_.isEqual(country.states, expectedStatesInAlphabeticalOrder), 'States returned are not in alphabetical order ' + JSON.stringify(country.states))
              _.each(country.states, function(state) {
                assert.property(state, 'id')
                assert.property(state, 'name')
                assert.property(state, 'lgas')
                let expectedLGAsInAlphabeticalOrder = _.orderBy(state.lgas, 'name', 'asc')
                assert.isTrue(_.isEqual(state.lgas, expectedLGAsInAlphabeticalOrder), 'LGAs returned are not in alphabetical order ' + JSON.stringify(state.lgas))
                _.each(country.lgas, function(lga) {
                  assert.property(lga, 'id')
                  assert.property(lga, 'name')
                })
              })
            })
            done()
          })
      })
    })
  })
})
