const _ = require('lodash')
const { query, knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function buildGeographySelectList() {
  const countriesStatesAndLGAs = await query(
    'Get countries, states and LGAs for select lists'
  )
    .from('Country as c')
    .innerJoin('Geography as g', 'g.countryId', 'c.id')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .leftJoin('Lga as l', 'l.id', 'g.lgaId')
    .orderBy(['c.name', 's.name', 'l.name'], 'asc')
    .select(
      'c.id as countryId',
      'c.name as countryName',
      's.id as stateId',
      's.name as stateName',
      'l.id as lgaId',
      'l.name as lgaName'
    )

  const result = {
    ok: true,
    data: _.map(
      _.uniqBy(countriesStatesAndLGAs, 'countryId'),
      countryRecord => ({
        id: countryRecord.countryId,
        name: countryRecord.countryName,
        states: _.map(
          _.filter(
            _.uniqBy(countriesStatesAndLGAs, 'stateId'),
            stateRecord =>
              stateRecord.stateId &&
              stateRecord.countryId === countryRecord.countryId
          ),
          stateRecord => ({
            id: stateRecord.stateId,
            name: stateRecord.stateName,
            lgas: _.map(
              _.filter(
                _.uniqBy(countriesStatesAndLGAs, 'lgaId'),
                lgaRecord =>
                  lgaRecord.lgaId &&
                  lgaRecord.countryId === countryRecord.countryId &&
                  lgaRecord.stateId === stateRecord.stateId
              ),
              lgaRecord => ({
                id: lgaRecord.lgaId,
                name: lgaRecord.lgaName,
              })
            ),
          })
        ),
      })
    ),
  }

  return result
}

async function countrySelectList(request) {
  const { params, auth } = request
  const { countryId, stateId } = params
  const dataConstraints = auth ? await getConstraints(auth.credentials) : null
  const addConstraintsLocal = auth ? addConstraints : _.identity

  let countries = []
  if (!countryId) {
    countries = await query('Get countries for select list')
      .from('Country as c')
      .leftJoin('Geography as g', 'g.countryId', 'c.id')
      .modify(addConstraintsLocal, dataConstraints, { geography: 'g' })
      .whereNull('g.stateId')
      .whereNull('g.lgaId')
      .orderBy(['c.name'], 'asc')
      .select('c.id', 'c.name')
  } else if (!stateId) {
    const countriesAndStates = await query(
      'Get countries and country states for select lists'
    )
      .from('Country as c')
      .innerJoin('Geography as g', 'g.countryId', 'c.id')
      .leftJoin('State as s', function() {
        this.on('s.id', 'g.stateId').on({ 'g.countryId': knex.raw(countryId) })
      })
      .modify(addConstraintsLocal, dataConstraints, { geography: 'g' })
      .orderBy(['c.name', 's.name'], 'asc')
      .distinct(
        'c.id as countryId',
        'c.name as countryName',
        's.id as stateId',
        's.name as stateName'
      )
    countries = _.map(
      _.uniqBy(countriesAndStates, 'countryId'),
      countryRecord => ({
        id: countryRecord.countryId,
        name: countryRecord.countryName,
      })
    )

    const selectedCountry = _.find(countries, { id: countryId })

    const selectedCountryStates = _.map(
      _.filter(countriesAndStates, stateRecord => stateRecord.stateId != null),
      stateRecord => ({
        id: stateRecord.stateId,
        name: stateRecord.stateName,
      })
    )

    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')
  } else {
    const countriesStatesAndLgas = await query(
      'Get countries, country states and state LGAs for select lists'
    )
      .from('Country as c')
      .innerJoin('Geography as g', 'g.countryId', 'c.id')
      .leftJoin('State as s', function() {
        this.on('s.id', 'g.stateId').on({ 'g.countryId': knex.raw(countryId) })
      })
      .leftJoin('Lga as l', function() {
        this.on('l.id', 'g.lgaId').on({ 'g.stateId': knex.raw(stateId) })
      })
      .modify(addConstraintsLocal, dataConstraints, { geography: 'g' })
      .orderBy(['c.name', 's.name', 'l.name'], 'asc')
      .distinct(
        'c.id as countryId',
        'c.name as countryName',
        's.id as stateId',
        's.name as stateName',
        'l.id as lgaId',
        'l.name as lgaName'
      )
    countries = _.map(
      _.uniqBy(countriesStatesAndLgas, 'countryId'),
      countryRecord => ({
        id: countryRecord.countryId,
        name: countryRecord.countryName,
      })
    )

    const selectedCountry = _.find(countries, { id: countryId })

    const selectedCountryStates = _.map(
      _.uniqBy(
        _.filter(
          countriesStatesAndLgas,
          stateRecord => stateRecord.stateId != null
        ),
        'stateId'
      ),
      stateRecord => ({
        id: stateRecord.stateId,
        name: stateRecord.stateName,
      })
    )
    selectedCountry.states = _.sortBy(selectedCountryStates, 'name')

    const selectedState = _.find(selectedCountry.states, { id: stateId })
    const selectedStateLgas = _.map(
      _.filter(countriesStatesAndLgas, lgaRecord => lgaRecord.lgaId != null),
      lgaRecord => ({
        id: lgaRecord.lgaId,
        name: lgaRecord.lgaName,
      })
    )

    selectedState.lgas = _.sortBy(selectedStateLgas, 'name')
  }

  return { ok: true, data: countries }
}

async function stateSelectList(request) {
  const { countryId, stateId } = request.params

  let states = []
  if (!stateId) {
    states = await query('Get states for select list')
      .from('State as s')
      .innerJoin('Geography as g', 'g.stateId', 's.id')
      .where('g.countryId', countryId)
      .orderBy(['s.name'], 'asc')
      .distinct('s.id', 's.name')
  } else {
    const statesAndLgas = await query(
      'Get states and state LGAs for select lists'
    )
      .from('State as s')
      .innerJoin('Geography as g', 'g.stateId', 's.id')
      .where('g.countryId', countryId)
      .leftJoin('Lga as l', function() {
        this.on('l.id', 'g.lgaId').on({ 'g.stateId': knex.raw(stateId) })
      })
      .orderBy(['s.name', 'l.name'], 'asc')
      .distinct(
        's.id as stateId',
        's.name as stateName',
        'l.id as lgaId',
        'l.name as lgaName'
      )
    states = _.map(_.uniqBy(statesAndLgas, 'stateId'), stateRecord => ({
      id: stateRecord.stateId,
      name: stateRecord.stateName,
    }))
    const selectedState = _.find(states, { id: stateId })
    const selectedStateLgas = _.map(
      _.filter(statesAndLgas, lgaRecord => lgaRecord.lgaId != null),
      lgaRecord => ({
        id: lgaRecord.lgaId,
        name: lgaRecord.lgaName,
      })
    )

    selectedState.lgas = _.sortBy(selectedStateLgas, 'name')
  }

  return { ok: true, data: states }
}

async function lgaSelectList(request) {
  const { params } = request
  const lgas = await query('Get LGAs for select list')
    .from('Lga as l')
    .innerJoin('Geography as g', 'g.lgaId', 'l.id')
    .where('g.stateId', params.stateId)
    .orderBy(['l.name'], 'asc')
    .distinct('l.id', 'l.name')

  return { ok: true, data: lgas }
}

async function transformGeographyFromUpdates(updates) {
  const geoFieldNames = ['countryId', 'stateId', 'lgaId']
  const geoFields = _.pick(updates, geoFieldNames)
  const transformedFields = _.omit(updates, geoFieldNames)

  if (!_.isEmpty(geoFields)) {
    const geography = await knex('Geography')
      .where(geoFields)
      .first('id')
    transformedFields.geographyId = geography ? geography.id : null
  }
  return transformedFields
}

module.exports = {
  buildGeographySelectList,
  countrySelectList,
  stateSelectList,
  lgaSelectList,
  transformGeographyFromUpdates,
}
