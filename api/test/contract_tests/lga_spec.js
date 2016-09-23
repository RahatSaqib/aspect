let _ = require('lodash')
let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('LGA routes',function(){

  describe('/api/lga/select-list',function(){
    let path = '/api/lga/select-list'

    describe('GET',function(){

      let stateId = 1 //This should correspond to a state ID in the database
      before(function(done) {
        server
          .get('/api/country/select-list')
          .set('Authorization', 'Bearer '+shared.token)
          .end(function(err,res){
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'data')
            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1, 'We need at least one country in the database to lookup a country\'s states')
            //We'll use the geography seed file to determine which country contains states which also contain LGAs
            let geography = require('../../seeds/development/fixtures/geography.json')
            let geographyCountriesWithStatesWithLGAs = _.filter(geography.countries, function(geographyCountry) {
              return !_.isEmpty(geographyCountry.states) &&
                _.some(geographyCountry.states, function (geographyState) {
                  return !_.isEmpty(geographyState.lgas)
                })
            })
            let responseCountryWithStatesWithLGAs = _.find(res.body.data, function(responseCountry) {
              return _.some(geographyCountriesWithStatesWithLGAs, { 'name': responseCountry.name })
            })
            //Otherwise, we'll just grab the last country in the list
            let lastCountry = _.last(res.body.data)
            let country = {
              id: responseCountryWithStatesWithLGAs ? responseCountryWithStatesWithLGAs.id : lastCountry.id,
              name: responseCountryWithStatesWithLGAs ? responseCountryWithStatesWithLGAs.name : lastCountry.name
            }
            server
              .get('/api/state/select-list/' + country.id)
              .set('Authorization', 'Bearer '+shared.token)
              .end(function(err,res){
                assert.equal(res.status, 200)
                assert.typeOf(res.body, 'Object')
                assert.property(res.body, 'data')
                assert.typeOf(res.body.data, 'array')
                assert.isAtLeast(res.body.data.length, 1, 'We need at least one state in the database to lookup a states\'s LGAs')
                //We'll use the results from our query on the geography seed file to determine which states contains LGAs
                let geographyCountry = _.find(geographyCountriesWithStatesWithLGAs, {name: country.name})
                let geographyStatesWithLGAs = _.filter(geographyCountry.states, function(geographyState) {
                  return !_.isEmpty(geographyState.lgas)
                })
                let responseStateWithLGAs = _.find(res.body.data, function(responseState) {
                  return _.some(geographyStatesWithLGAs, { 'name': responseState.name })
                })
                //Otherwise, we'll just grab the last state in the list
                stateId = responseStateWithLGAs ? responseStateWithLGAs.id : _.last(res.body.data).id

                done()
              })
          })
      })

      it('should return a list of LGA names and IDs in alphabetical order', function(done){
        server
          .get(path + '/' + stateId)
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
            assert.isTrue(_.isEqual(res.body.data, expectedInAlphabeticalOrder), 'LGAs returned are not in alphabetical order ' + JSON.stringify(res.body.data))
            done()
          })
      })
    })
  })
})
