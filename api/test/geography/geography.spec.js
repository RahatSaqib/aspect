let _ = require('lodash')
let supertest = require('supertest')
let chai = require('chai')
let shared = require('../utils/sharedToken')

// This agent refers to PORT where program is running.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('Geography routes', function(){
  describe('/api/geography/select-list', function(){
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

  describe('/geography/country-select-list', function(){
    let path = '/api/geography/country-select-list'

    describe('GET',function(){
      shared.checkToken(server, path)

      describe('with no selected country', function(){
        it('should return a list of country IDs and names ordered by name', function(done){
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
              })
              done()
            })
        })
      })

      describe('with a selected country and no selected state', function(){
        it('should return a list of country IDs and names, ordered by name and populating the states of the selected country', function(done){
          //First get the full country/state/LGA tree so that we can pick a countryId to query
          server
            .get('/api/geography/select-list')
            .set('Authorization', 'Bearer '+ shared.token)
            .end(function(err,res){
              const countryWithStates = _.find(res.body.data, function (country) {
                return country.states.length > 0
              })
              server
                .get(path + '/' + countryWithStates.id)
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
                    if(country.id === countryWithStates.id) {
                      assert.property(country, 'states')
                      assert.typeOf(country.states, 'array')
                      assert.isAtLeast(country.states.length, 1)
                    } else {
                      assert.equal(country.states, undefined)
                    }
                  })
                  done()
                })
            })
        })
      })

      describe('with a selected country and a selected state', function(){
        it('should return a list of country IDs and names, ordered by name and populating the states of the selected country and the LGAs of the selected state', function(done){
          //First get the full country/state/LGA tree so that we can pick a countryId to query
          server
            .get('/api/geography/select-list')
            .set('Authorization', 'Bearer '+ shared.token)
            .end(function(err,res){
              const countryWithStatesAndLGAs = _.find(res.body.data, function (country) {
                return _.some(country.states, function(state) {
                  return state.lgas.length > 0
                })
              }), stateWithLGAs = _.find(countryWithStatesAndLGAs.states, function(state) {
                return state.lgas.length > 0
              })
              server
                .get(path + '/' + countryWithStatesAndLGAs.id + '/' + stateWithLGAs.id)
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
                    if(country.id === countryWithStatesAndLGAs.id) {
                      assert.property(country, 'states')
                      assert.typeOf(country.states, 'array')
                      assert.isAtLeast(country.states.length, 1)
                      _.each(country.states, function(state) {
                        assert.property(state, 'id')
                        assert.property(state, 'name')
                        if(state.id === stateWithLGAs.id) {
                          assert.property(state, 'lgas')
                          assert.typeOf(state.lgas, 'array')
                          assert.isAtLeast(state.lgas.length, 1)
                        } else {
                          assert.equal(state.lgas, undefined)
                        }
                      })
                    } else {
                      assert.equal(country.states, undefined)
                    }
                  })
                  done()
                })
            })
        })
      })
    })
  })

  describe('/geography/state-select-list/{countryId}', function(){
    let path = '/api/geography/state-select-list/'

    describe('GET',function(){
      it('should return a list of state IDs and names for the country ordered by name', function(done){
        //First get the full country/state/LGA tree so that we can pick a countryId to query
        server
          .get('/api/geography/select-list')
          .set('Authorization', 'Bearer '+ shared.token)
          .end(function(err,res){
            const countryWithStates = _.find(res.body.data, function (country) {
              return country.states.length > 0
            })
            server
              .get(path + countryWithStates.id)
              .set('Authorization', 'Bearer '+shared.token)
              .end(function(err,res){
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
                assert.property(res.body, 'data')
                assert.typeOf(res.body.data, 'array')
                assert.isAtLeast(res.body.data.length, 1)
                let expectedStatesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
                assert.isTrue(_.isEqual(res.body.data, expectedStatesInAlphabeticalOrder), 'States returned are not in alphabetical order ' + JSON.stringify(res.body.data))
                _.each(res.body.data, function(state) {
                  assert.property(state, 'id')
                  assert.property(state, 'name')
                })
                done()
              })
          })
      })
    })
  })

  describe('/geography/lga-select-list/{stateId}', function(){
    let path = '/api/geography/lga-select-list/'

    describe('GET',function(){
      it('should return a list of LGA IDs and names for the country ordered by name', function(done){
        //First get the full country/state/LGA tree so that we can pick a stateId to query
        server
          .get('/api/geography/select-list')
          .set('Authorization', 'Bearer '+shared.token)
          .end(function(err,res){
            const stateWithLgas = _.find(_.find(res.body.data, function (country) {
                return _.some(country.states, function(state) {
                  return state.lgas.length > 0
                })
              }).states, function(state) {
                return state.lgas.length > 0
              })
            server
              .get(path + stateWithLgas.id)
              .set('Authorization', 'Bearer '+shared.token)
              .end(function(err,res){
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
                assert.property(res.body, 'data')
                assert.typeOf(res.body.data, 'array')
                assert.isAtLeast(res.body.data.length, 1)
                let expectedStatesInAlphabeticalOrder = _.orderBy(res.body.data, 'name', 'asc')
                assert.isTrue(_.isEqual(res.body.data, expectedStatesInAlphabeticalOrder), 'LGAs returned are not in alphabetical order ' + JSON.stringify(res.body.data))
                _.each(res.body.data, function(state) {
                  assert.property(state, 'id')
                  assert.property(state, 'name')
                })
                done()
              })
          })
      })
    })
  })
})
