let _ = require('lodash')
let supertest = require('supertest')
let chai = require('chai')
let shared = require('./shared_tests')

// This agent refers to PORT where program is runninng.
let server = supertest.agent('http://localhost:8080')
let assert = chai.assert

describe('State routes',function(){

  describe('/api/state/select-list',function(){
    let path = '/api/state/select-list'

    describe('GET',function(){

      let countryId = 1 //This should correspond to a country ID in the database
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
            //We'll use the geography seed file to determine which country contains states
            let geography = require('../../seeds/development/fixtures/geography.json')
            let geographyCountriesWithStates = _.filter(geography.countries, function(geographyCountry) {
              return !_.isEmpty(geographyCountry.states)
            })
            let responseCountryWithStates = _.find(res.body.data, function(responseCountry) {
              return _.some(geographyCountriesWithStates, { 'name': responseCountry.name })
            })
            //Otherwise, we'll just grab the last country in the list
            countryId = responseCountryWithStates ? responseCountryWithStates.id :
              _.last(res.body.data).id
            done()
          })
      })

      it('should return a list of state names and IDs in alphabetical order', function(done){
        server
          .get(path + '/' + countryId)
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
            assert.isTrue(_.isEqual(res.body.data, expectedInAlphabeticalOrder), 'States returned are not in alphabetical order ' + JSON.stringify(res.body.data))
            done()
          })
      })
    })
  })
})
