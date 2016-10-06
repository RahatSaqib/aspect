let proxyquire = require('proxyquire')
let {assert} = require('chai')
let _ = require('lodash')
let sinon = require('sinon')
let {run} = require('../utils/generatorFunctionUtils')

describe('geography service', function () {
  const countriesStatesAndLGAs = [{countryId: 1, countryName: 'Nigeria', stateId: 1, stateName: 'Lagos', lgaId: 1, lgaName: 'Apapa'},
    {countryId: 1, countryName: 'Nigeria', stateId: 1, stateName: 'Lagos', lgaId: 2, lgaName: 'Mushin'},
    {countryId: 1, countryName: 'Nigeria', stateId: 1, stateName: 'Lagos', lgaId: 3, lgaName: 'Ojo'},
    {countryId: 1, countryName: 'Nigeria', stateId: 2, stateName: 'Ogun', lgaId: 4, lgaName: 'Ifo'},
    {countryId: 1, countryName: 'Nigeria', stateId: 2, stateName: 'Ogun', lgaId: 5, lgaName: 'Ipokia'},
    {countryId: 2, countryName: 'United States', stateId: 4, stateName: 'Alabama', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 3, stateName: 'Alaska', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 6, stateName: 'Arizona', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 5, stateName: 'Arkansas', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 7, stateName: 'California', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 8, stateName: 'Colorado', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 9, stateName: 'Connecticut', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 11, stateName: 'Delaware', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 10, stateName: 'District of Columbia', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 12, stateName: 'Florida', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 13, stateName: 'Georgia', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 14, stateName: 'Hawaii', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 16, stateName: 'Idaho', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 17, stateName: 'Illinois', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 18, stateName: 'Indiana', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 15, stateName: 'Iowa', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 19, stateName: 'Kansas', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 20, stateName: 'Kentucky', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 21, stateName: 'Louisiana', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 23, stateName: 'Maine', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 22, stateName: 'Maryland', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 24, stateName: 'Massachusetts', lgaId: 6, lgaName: 'Franklin'},
    {countryId: 2, countryName: 'United States', stateId: 24, stateName: 'Massachusetts', lgaId: 7, lgaName: 'Suffolk'},
    {countryId: 2, countryName: 'United States', stateId: 25, stateName: 'Michigan', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 26, stateName: 'Minnesota', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 28, stateName: 'Mississippi', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 27, stateName: 'Missouri', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 29, stateName: 'Montana', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 32, stateName: 'Nebraska', lgaId: 9, lgaName: 'Gage'},
    {countryId: 2, countryName: 'United States', stateId: 32, stateName: 'Nebraska', lgaId: 8, lgaName: 'Hall'},
    {countryId: 2, countryName: 'United States', stateId: 32, stateName: 'Nebraska', lgaId: 10, lgaName: 'Lancaster'},
    {countryId: 2, countryName: 'United States', stateId: 32, stateName: 'Nebraska', lgaId: 11, lgaName: 'Wayne'},
    {countryId: 2, countryName: 'United States', stateId: 36, stateName: 'Nevada', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 33, stateName: 'New Hampshire', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 34, stateName: 'New Jersey', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 35, stateName: 'New Mexico', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 37, stateName: 'New York', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 30, stateName: 'North Carolina', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 31, stateName: 'North Dakota', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 39, stateName: 'Ohio', lgaId: 13, lgaName: 'Cuyahoga'},
    {countryId: 2, countryName: 'United States', stateId: 39, stateName: 'Ohio', lgaId: 12, lgaName: 'Wayne'},
    {countryId: 2, countryName: 'United States', stateId: 38, stateName: 'Oklahoma', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 40, stateName: 'Oregon', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 41, stateName: 'Pennsylvania', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 42, stateName: 'Rhode Island', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 43, stateName: 'South Carolina', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 44, stateName: 'South Dakota', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 45, stateName: 'Tennessee', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 46, stateName: 'Texas', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 47, stateName: 'Utah', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 49, stateName: 'Vermont', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 48, stateName: 'Virginia', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 50, stateName: 'Washington', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 52, stateName: 'West Virginia', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 51, stateName: 'Wisconsin', lgaId: null, lgaName: null},
    {countryId: 2, countryName: 'United States', stateId: 53, stateName: 'Wyoming', lgaId: null, lgaName: null}]
  let dbSpy, service

  beforeEach(function () {
    dbSpy = require('../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    service = proxyquire.noCallThru().load('../../src/geography/service', {
      '../db': dbSpy
    })
  })

  afterEach(function() {
    dbSpy.query.restore()
  })

  describe('buildGeographySelectList', function () {
    beforeEach(function () {
      dbSpy.query.for('Get countries, states and LGAs for select lists').resolvesWith(countriesStatesAndLGAs)
    })

    it('Should query the country, state and lga tables, sorting the results by country name, then state name, then lga name', function () {
      return run(service.buildGeographySelectList)(function() {
        const countriesStatesAndLGAsQuery = dbSpy.query.withArgs('Get countries, states and LGAs for select lists').lastCall.returnValue
        assert.equal(countriesStatesAndLGAsQuery.from.lastCall.args[0], 'country as c')
        const leftJoins = countriesStatesAndLGAsQuery.leftJoin.getCalls()
        const statesLeftJoin = _.find(leftJoins, function (leftJoin) {
          return _.isEqual(leftJoin.args, ['state as s', 'c.id', 's.countryId'])
        })
        assert.isOk(statesLeftJoin, 'Can\'t find the join to the states table')
        const lgasLeftJoin = _.find(leftJoins, function (leftJoin) {
          return _.isEqual(leftJoin.args, ['lga as l', 's.id', 'l.stateId'])
        })
        assert.isOk(lgasLeftJoin, 'Can\'t find the join to the LGAs table')
        assert.deepEqual(countriesStatesAndLGAsQuery.orderBy.lastCall.args, [['c.name', 's.name', 'l.name'], 'asc'], 'The orderBy clause seems to be incorrect')
        assert.deepEqual(countriesStatesAndLGAsQuery.select.lastCall.args, ['c.id as countryId', 'c.name as countryName', 's.id as stateId', 's.name as stateName', 'l.id as lgaId', 'l.name as lgaName'], 'The select clause seems to be incorrect')
      })
    })

    it('Should return a list of countries containing its nested states and LGAs', function () {
      return run(service.buildGeographySelectList)(function(response) {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, countries)
      })
    })

    const countries = _.map(_.uniqBy(countriesStatesAndLGAs, 'countryId'), function(countryRecord) {
      return {
        id: countryRecord.countryId,
        name: countryRecord.countryName,
        states: _.map(_.filter(_.uniqBy(countriesStatesAndLGAs, 'stateId'), function(stateRecord){
          return stateRecord.stateId && stateRecord.countryId === countryRecord.countryId
        }), function(stateRecord) {
          return {
            id: stateRecord.stateId,
            name: stateRecord.stateName,
            lgas: _.map(_.filter(_.uniqBy(countriesStatesAndLGAs, 'lgaId'), function(lgaRecord){
              return lgaRecord.lgaId && lgaRecord.countryId === countryRecord.countryId &&
                lgaRecord.stateId === stateRecord.stateId
            }), function(lgaRecord) {
              return {
                id: lgaRecord.lgaId,
                name: lgaRecord.lgaName
              }
            })
          }
        })
      }
    })
  })

  describe('countrySelectList', function () {
    const countriesForSelectList = _.sortBy(_.uniqBy(
      _.map(countriesStatesAndLGAs, function(result) {
        return {
          id: result.countryId,
          name: result.countryName
        }
      }), 'id'), 'name')

    beforeEach(function () {
      dbSpy.query.for('Get countries for select list').resolvesWith(countriesForSelectList)
    })

    it('Should query the country table, sorting the results by country name', function () {
      return run(service.countrySelectList)(function() {
        const countyQuery = dbSpy.query.withArgs('Get countries for select list').lastCall.returnValue
        assert.equal(countyQuery.from.lastCall.args[0], 'country as c')
        assert.deepEqual(countyQuery.orderBy.lastCall.args, [['c.name'], 'asc'], 'The orderBy clause seems to be incorrect')
        assert.deepEqual(countyQuery.select.lastCall.args, ['c.id', 'c.name'], 'The select clause seems to be incorrect')
      })
    })

    it('Should return a list of countries', function () {
      return run(service.countrySelectList)(function(response) {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, countriesForSelectList)
      })
    })
  })

  describe('stateSelectList', function () {
    const statesForSelectList = _.sortBy(_.uniqBy(
      _.map(_.filter(countriesStatesAndLGAs, {countryId: 2}), function(result) {
        return {
          id: result.stateId,
          name: result.stateName
        }
      }), 'id'), 'name'),
      requestData = {params: { countryId: 2 } }


    beforeEach(function () {
      dbSpy.query.for('Get states for select list').resolvesWith(statesForSelectList)
    })

    it('Should query the state table, filtering by country ID, sorting the results by state name', function () {
      return run(service.stateSelectList, [requestData])(function() {
        const stateQuery = dbSpy.query.withArgs('Get states for select list').lastCall.returnValue
        assert.equal(stateQuery.from.lastCall.args[0], 'state as s')
        assert.deepEqual(stateQuery.where.lastCall.args, ['s.countryId', requestData.params.countryId], 'The where clause seems to be incorrect')
        assert.deepEqual(stateQuery.orderBy.lastCall.args, [['s.name'], 'asc'], 'The orderBy clause seems to be incorrect')
        assert.deepEqual(stateQuery.select.lastCall.args, ['s.id', 's.name'], 'The select clause seems to be incorrect')
      })
    })

    it('Should return a list of states', function () {
      return run(service.stateSelectList, [requestData])(function(response) {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, statesForSelectList)
      })
    })
  })

  describe('lgaSelectList', function () {
    const lgasForSelectList = _.sortBy(_.uniqBy(
      _.map(_.filter(countriesStatesAndLGAs, {countryId: 32}), function(result) {
        return {
          id: result.lgaId,
          name: result.lgaName
        }
      }), 'id'), 'name'),
      requestData = {params: { stateId: 32 } }

    beforeEach(function () {
      dbSpy.query.for('Get LGAs for select list').resolvesWith(lgasForSelectList)
    })

    it('Should query the lga table, filtering by state ID, sorting the results by LGA name', function () {
      return run(service.lgaSelectList, [requestData])(function() {
        const stateQuery = dbSpy.query.withArgs('Get LGAs for select list').lastCall.returnValue
        assert.equal(stateQuery.from.lastCall.args[0], 'lga as l')
        assert.deepEqual(stateQuery.where.lastCall.args, ['l.stateId', requestData.params.stateId], 'The orderBy clause seems to be incorrect')
        assert.deepEqual(stateQuery.orderBy.lastCall.args, [['l.name'], 'asc'], 'The orderBy clause seems to be incorrect')
        assert.deepEqual(stateQuery.select.lastCall.args, ['l.id', 'l.name'], 'The select clause seems to be incorrect')
      })
    })

    it('Should return a list of LGAs', function () {
      return run(service.lgaSelectList, [requestData])(function(response) {
        assert.isTrue(response.ok)
        assert.deepEqual(response.data, lgasForSelectList)
      })
    })
  })
})
