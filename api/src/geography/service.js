let _ = require('lodash')
let { query } = require('../db')

function* buildGeographySelectList(){
  const countriesStatesAndLGAs = yield query('Get countries, states and LGAs for select lists')
    .from('country as c')
    .leftJoin('state as s', 'c.id', 's.countryId')
    .leftJoin('lga as l', 's.id', 'l.stateId')
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

function* countrySelectList(){
  const countries = yield query('Get countries for select list')
    .from('country as c')
    .orderBy(['c.name'], 'asc')
    .select('c.id', 'c.name')

  const result = {
    ok: true,
    data: countries
  }

  return result
}

function* stateSelectList(request){
  const {params} = request
  const states = yield query('Get states for select list')
    .from('state as s')
    .where('s.countryId', params.countryId)
    .orderBy(['s.name'], 'asc')
    .select('s.id', 's.name')

  const result = {
    ok: true,
    data: states
  }

  return result
}

function* lgaSelectList(request){
  const {params} = request
  const lgas = yield query('Get LGAs for select list')
    .from('lga as l')
    .where('l.stateId', params.stateId)
    .orderBy(['l.name'], 'asc')
    .select('l.id', 'l.name')

  const result = {
    ok: true,
    data: lgas
  }

  return result
}

module.exports = {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  lgaSelectList
}
