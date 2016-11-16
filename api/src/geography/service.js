let _ = require('lodash')
let { query, knex } = require('../db')

function* buildGeographySelectList(){
  const countriesStatesAndLGAs = yield query('Get countries, states and LGAs for select lists')
    .from('Country as c')
    .leftJoin('State as s', 'c.id', 's.countryId')
    .leftJoin('Lga as l', 's.id', 'l.stateId')
    .orderBy(['c.name', 's.name', 'l.name'], 'asc')
    .select('c.id as countryId', 'c.name as countryName', 's.id as stateId',
      's.name as stateName', 'l.id as lgaId', 'l.name as lgaName')

  const result = {
    ok: true,
    data: _.map(_.uniqBy(countriesStatesAndLGAs, 'countryId'), function(countryRecord) {
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
  }

  return result
}

function* countrySelectList(request){
  const {countryId, stateId} = request.params

  let countries = []
  if(!countryId) {
    countries = yield query('Get countries for select list')
      .from('Country as c')
      .orderBy(['c.name'], 'asc')
      .select('c.id', 'c.name')
  } else if (!stateId) {
    const countriesAndStates = yield query('Get countries and country states for select lists')
      .from('Country as c')
      .leftJoin('State as s', function () {
        this.on('c.id', 's.countryId')
          .on({countryId: knex.raw(countryId)})
      })
      .orderBy(['c.name', 's.name'], 'asc')
      .select('c.id as countryId', 'c.name as countryName', 's.id as stateId',
        's.name as stateName')
    countries = _.map(_.uniqBy(countriesAndStates, 'countryId'), function(countryRecord) {
      return {
        id: countryRecord.countryId,
        name: countryRecord.countryName
      }
    })
    const selectedCountry = _.find(countries, {id: countryId}),
      selectedCountryStates = _.map(_.filter(countriesAndStates, function(stateRecord) {
        return stateRecord.stateId != null
      }), function(stateRecord) {
        return {
          id: stateRecord.stateId,
          name: stateRecord.stateName
        }
      })
    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')
  } else {
    const countriesStatesAndLgas = yield query('Get countries, country states and state LGAs for select lists')
      .from('Country as c')
      .leftJoin('State as s', function () {
        this.on('c.id', 's.countryId')
          .on({countryId: knex.raw(countryId)})
      })
      .leftJoin('Lga as l', function () {
        this.on('s.id', 'l.stateId')
          .on({stateId: knex.raw(stateId)})
      })
      .orderBy(['c.name', 's.name', 'l.name'], 'asc')
      .select('c.id as countryId', 'c.name as countryName', 's.id as stateId',
        's.name as stateName', 'l.id as lgaId', 'l.name as lgaName')
    countries = _.map(_.uniqBy(countriesStatesAndLgas, 'countryId'), function(countryRecord) {
      return {
        id: countryRecord.countryId,
        name: countryRecord.countryName
      }
    })
    const selectedCountry = _.find(countries, {id: countryId}),
      selectedCountryStates = _.map(_.uniqBy(_.filter(countriesStatesAndLgas, function(stateRecord) {
        return stateRecord.stateId != null
      }), 'stateId'), function(stateRecord) {
        return {
          id: stateRecord.stateId,
          name: stateRecord.stateName
        }
      })
    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')
    const selectedState = _.find(selectedCountry.states, {id: stateId}),
      selectedStateLgas = _.map(_.filter(countriesStatesAndLgas, function(lgaRecord) {
        return lgaRecord.lgaId != null
      }), function(lgaRecord) {
        return {
          id: lgaRecord.lgaId,
          name: lgaRecord.lgaName
        }
      })

    selectedState.lgas = _.sortBy(selectedStateLgas, 'name')
  }

  return { ok: true, data: countries }
}

function* stateSelectList(request){
  const {countryId, stateId} = request.params

  let states = []
  if(!stateId) {
    states = yield query('Get states for select list')
      .from('State as s')
      .where('s.countryId', countryId)
      .orderBy(['s.name'], 'asc')
      .select('s.id', 's.name')

  } else {
    const statesAndLgas = yield query('Get states and state LGAs for select lists')
      .from('State as s')
      .where('s.countryId', countryId)
      .leftJoin('Lga as l', function () {
        this.on('s.id', 'l.stateId')
          .on({stateId: knex.raw(stateId)})
      })
      .orderBy(['s.name', 'l.name'], 'asc')
      .select('s.id as stateId', 's.name as stateName', 'l.id as lgaId', 'l.name as lgaName')
    states = _.map(_.uniqBy(statesAndLgas, 'stateId'), function(stateRecord) {
      return {
        id: stateRecord.stateId,
        name: stateRecord.stateName
      }
    })
    const selectedState = _.find(states, {id: stateId})
    const selectedStateLgas = _.map(_.filter(statesAndLgas, function(lgaRecord) {
      return lgaRecord.lgaId != null
    }), function(lgaRecord) {
      return {
        id: lgaRecord.lgaId,
        name: lgaRecord.lgaName
      }
    })

    selectedState.lgas = _.sortBy(selectedStateLgas, 'name')
  }

  return { ok: true, data: states }
}

function* lgaSelectList(request){
  const {params} = request
  const lgas = yield query('Get LGAs for select list')
    .from('Lga as l')
    .where('l.stateId', params.stateId)
    .orderBy(['l.name'], 'asc')
    .select('l.id', 'l.name')

  return { ok: true, data: lgas }
}

module.exports = {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  lgaSelectList
}
